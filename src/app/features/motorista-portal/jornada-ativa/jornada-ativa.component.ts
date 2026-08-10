import { CommonModule } from '@angular/common';
import { Component, ElementRef, OnInit, ViewChild, OnDestroy, AfterViewInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Subscription, timer } from 'rxjs';
import * as maplibregl from 'maplibre-gl';

import { HistoricoService, Jornada } from '../../../core/services/historico.service';

@Component({
  selector: 'app-jornada-ativa',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './jornada-ativa.component.html',
  styleUrl: './jornada-ativa.component.scss'
})
export class JornadaAtivaComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('mapContainer', { static: false }) mapContainer!: ElementRef;
  
  jornadaId: string = '';
  jornada: Jornada | null = null;
  loading = true;
  
  map!: maplibregl.Map;
  
  tempoDecorrido: string = '00:00:00';
  distancia: string = '--';
  eta: string = '--';
  
  private timerSub?: Subscription;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient,
    private historicoService: HistoricoService
  ) {}

  ngOnInit(): void {
    this.jornadaId = this.route.snapshot.paramMap.get('id') || '';
    if (this.jornadaId) {
      this.loadJornada();
    }
  }

  ngAfterViewInit(): void {
    // Inicialização do mapa aguardará o carregamento da jornada
  }

  ngOnDestroy(): void {
    if (this.timerSub) this.timerSub.unsubscribe();
    if (this.map) this.map.remove();
  }

  async loadJornada() {
    this.loading = true;
    try {
      this.jornada = await this.historicoService.getJornadaById(this.jornadaId);
      this.iniciarCronometro();
      setTimeout(() => this.initMap(), 100);
    } catch (e) {
      console.error(e);
      alert('Erro ao carregar a jornada.');
    } finally {
      this.loading = false;
    }
  }

  iniciarCronometro() {
    if (!this.jornada || !this.jornada.iniciado_em) return;
    
    const inicio = new Date(this.jornada.iniciado_em).getTime();
    
    this.timerSub = timer(0, 1000).subscribe(() => {
      const agora = new Date().getTime();
      const diff = agora - inicio;
      
      const horas = Math.floor(diff / (1000 * 60 * 60));
      const minutos = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const segundos = Math.floor((diff % (1000 * 60)) / 1000);
      
      this.tempoDecorrido = 
        `${horas.toString().padStart(2, '0')}:${minutos.toString().padStart(2, '0')}:${segundos.toString().padStart(2, '0')}`;
    });
  }

  initMap() {
    if (!this.mapContainer || !this.jornada) return;
    if (!this.jornada.origem_longitude || !this.jornada.origem_latitude) return;

    const lon1 = this.jornada.origem_longitude;
    const lat1 = this.jornada.origem_latitude;
    const lon2 = this.jornada.destino_longitude;
    const lat2 = this.jornada.destino_latitude;

    this.map = new maplibregl.Map({
      container: this.mapContainer.nativeElement,
      style: 'https://tiles.openfreemap.org/styles/liberty', 
      center: [lon1, lat1],
      zoom: 12
    });

    // Adiciona controles
    this.map.addControl(new maplibregl.NavigationControl({}), 'top-right');

    this.map.on('load', () => {
      setTimeout(() => this.map?.resize(), 200); // Fix mobile visual bug
      // Adicionar marcador de origem
      new maplibregl.Marker({ color: '#b91c1c' })
        .setLngLat([lon1, lat1])
        .setPopup(new maplibregl.Popup().setText('Origem: ' + this.jornada?.origem))
        .addTo(this.map);

      if (lon2 && lat2) {
        // Adicionar marcador de destino
        new maplibregl.Marker({ color: '#137333' })
          .setLngLat([lon2, lat2])
          .setPopup(new maplibregl.Popup().setText('Destino: ' + this.jornada?.destino))
          .addTo(this.map);

        // Buscar rota via OSRM demo public API
        this.fetchRoute(lon1, lat1, lon2, lat2);
      }
    });
  }

  fetchRoute(lon1: number, lat1: number, lon2: number, lat2: number) {
    const url = `https://router.project-osrm.org/route/v1/driving/${lon1},${lat1};${lon2},${lat2}?overview=full&geometries=geojson`;
    
    this.http.get<any>(url).subscribe(res => {
      if (res.routes && res.routes.length > 0) {
        const route = res.routes[0];
        
        // Atualiza dist e tempo
        this.distancia = (route.distance / 1000).toFixed(1) + ' km';
        const etaMins = Math.ceil(route.duration / 60);
        this.eta = etaMins > 60 ? `${Math.floor(etaMins/60)}h ${etaMins%60}m` : `${etaMins} min`;

        const coordinates = route.geometry.coordinates;

        this.map.addSource('route', {
          type: 'geojson',
          data: {
            type: 'Feature',
            properties: {},
            geometry: {
              type: 'LineString',
              coordinates: coordinates
            }
          }
        });

        this.map.addLayer({
          id: 'route',
          type: 'line',
          source: 'route',
          layout: {
            'line-join': 'round',
            'line-cap': 'round'
          },
          paint: {
            'line-color': '#1a73e8',
            'line-width': 5,
            'line-opacity': 0.7
          }
        });

        // Fit bounds
        const bounds = coordinates.reduce((b: any, coord: any) => {
          return b.extend(coord);
        }, new maplibregl.LngLatBounds(coordinates[0], coordinates[0]));
        
        this.map.fitBounds(bounds, {
          padding: 50
        });
      }
    });
  }

  finalizarJornada() {
    this.router.navigate(['/motorista/checkout', this.jornadaId]);
  }
}
