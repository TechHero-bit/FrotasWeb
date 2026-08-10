import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Subject, debounceTime, distinctUntilChanged, switchMap, of, catchError } from 'rxjs';
import * as maplibregl from 'maplibre-gl';

import { VeiculosService, Veiculo } from '../../../core/services/veiculos.service';
import { HistoricoService } from '../../../core/services/historico.service';
import { StorageService } from '../../../core/services/storage.service';
import { SupabaseService } from '../../../core/services/supabase.service';

const LOCATIONIQ_TOKEN = 'pk.2bd751445ee7150a339d49346a83657a';

@Component({
  selector: 'app-checkin',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './checkin.component.html',
  styleUrl: './checkin.component.scss'
})
export class CheckinComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('mapPreviewContainer', { static: false }) mapPreviewContainer!: ElementRef;
  veiculoId: string = '';
  veiculo: Veiculo | null = null;
  loading = true;
  submitting = false;
  
  checkinForm: FormGroup;
  
  // LocationIQ Autocomplete
  origemSearch$ = new Subject<string>();
  destinoSearch$ = new Subject<string>();
  origemResults: any[] = [];
  destinoResults: any[] = [];
  showOrigemResults = false;
  showDestinoResults = false;
  
  origemLat?: number;
  origemLon?: number;
  destinoLat?: number;
  destinoLon?: number;

  // Map preview
  previewMap: maplibregl.Map | null = null;
  private originMarker: maplibregl.Marker | null = null;
  private destinationMarker: maplibregl.Marker | null = null;
  routeDistance: string = '';
  routeEta: string = '';
  routeLoading = false;
  showRoutePreview = false;

  fotos = {
    foto_painel: { file: null as File | null, preview: '' },
    selfie: { file: null as File | null, preview: '' },
    foto_frente: { file: null as File | null, preview: '' },
    foto_traseira: { file: null as File | null, preview: '' },
    foto_lateral_esquerda: { file: null as File | null, preview: '' },
    foto_lateral_direita: { file: null as File | null, preview: '' }
  };

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private fb: FormBuilder,
    private http: HttpClient,
    private veiculosService: VeiculosService,
    private historicoService: HistoricoService,
    private storageService: StorageService,
    private supabaseService: SupabaseService
  ) {
    this.checkinForm = this.fb.group({
      origem: ['', Validators.required],
      destino: ['', Validators.required],
      km_inicial: ['', [Validators.required, Validators.min(0)]],
      nivel_combustivel: ['100', Validators.required]
    });
  }

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      this.veiculoId = params.get('id') || '';
      if (this.veiculoId) {
        this.loadVeiculo();
      } else {
        this.loading = false;
      }
    });

    this.setupAutocomplete();
  }

  ngAfterViewInit(): void {
    // Map will be initialized when both addresses are selected
  }

  ngOnDestroy(): void {
    if (this.originMarker) {
      this.originMarker.remove();
      this.originMarker = null;
    }
    if (this.destinationMarker) {
      this.destinationMarker.remove();
      this.destinationMarker = null;
    }
    if (this.previewMap) {
      this.previewMap.remove();
      this.previewMap = null;
    }
  }

  async loadVeiculo() {
    this.loading = true;
    try {
      const veiculos = await this.veiculosService.getVeiculos();
      this.veiculo = veiculos.find(v => String(v.id) === String(this.veiculoId)) || null;
      
      if (this.veiculo) {
        this.checkinForm.patchValue({
          km_inicial: this.veiculo.km_atual || 0,
          nivel_combustivel: this.veiculo.nivel_combustivel ? this.veiculo.nivel_combustivel.toString() : '100'
        });
      } else {
        console.warn('Veículo não encontrado com o ID:', this.veiculoId);
      }
    } catch (e) {
      console.error('Erro ao carregar veículo:', e);
    } finally {
      this.loading = false;
    }
  }

  setupAutocomplete() {
    this.origemSearch$.pipe(
      debounceTime(400),
      distinctUntilChanged(),
      switchMap(term => this.searchLocation(term))
    ).subscribe(results => {
      this.origemResults = results;
    });

    this.destinoSearch$.pipe(
      debounceTime(400),
      distinctUntilChanged(),
      switchMap(term => this.searchLocation(term))
    ).subscribe(results => {
      this.destinoResults = results;
    });
  }

  searchLocation(term: string) {
    if (!term || term.length < 3) return of([]);
    // Bounding box do estado do Rio de Janeiro: W, S, E, N
    const rjViewbox = '-44.889,-23.370,-40.958,-20.764';
    const url = `https://api.locationiq.com/v1/autocomplete.php?key=${LOCATIONIQ_TOKEN}&q=${encodeURIComponent(term)}&countrycodes=br&limit=5&addressdetails=1&format=json&bounded=1&viewbox=${rjViewbox}`;
    return this.http.get<any[]>(url).pipe(
      catchError(() => of([]))
    );
  }

  onOrigemInput(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.origemSearch$.next(value);
    this.showOrigemResults = true;
  }

  onDestinoInput(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.destinoSearch$.next(value);
    this.showDestinoResults = true;
  }

  selectOrigem(result: any) {
    this.checkinForm.patchValue({ origem: result.display_name });
    this.origemLat = parseFloat(result.lat);
    this.origemLon = parseFloat(result.lon);
    this.showOrigemResults = false;
    this.tryLoadRoutePreview();
  }

  selectDestino(result: any) {
    this.checkinForm.patchValue({ destino: result.display_name });
    this.destinoLat = parseFloat(result.lat);
    this.destinoLon = parseFloat(result.lon);
    this.showDestinoResults = false;
    this.tryLoadRoutePreview();
  }

  tryLoadRoutePreview() {
    if (this.origemLat != null && this.origemLon != null &&
        this.destinoLat != null && this.destinoLon != null) {
      this.showRoutePreview = true;
      this.routeLoading = true;
      this.routeDistance = '';
      this.routeEta = '';

      // Wait for the DOM to render the map container
      setTimeout(() => this.initPreviewMap(), 150);
    }
  }

  initPreviewMap() {
    if (!this.mapPreviewContainer) return;
    if (this.origemLat == null || this.origemLon == null ||
        this.destinoLat == null || this.destinoLon == null) return;

    const lon1 = this.origemLon;
    const lat1 = this.origemLat;
    const lon2 = this.destinoLon;
    const lat2 = this.destinoLat;

    // Calculate initial bounds for immediate zoom
    const bounds = new maplibregl.LngLatBounds(
      [Math.min(lon1, lon2), Math.min(lat1, lat2)],
      [Math.max(lon1, lon2), Math.max(lat1, lat2)]
    );

    if (this.previewMap) {
      // Remove old route layer/source before fetching a new one
      if (this.previewMap.getLayer('route-preview')) {
        this.previewMap.removeLayer('route-preview');
      }
      if (this.previewMap.getSource('route-preview')) {
        this.previewMap.removeSource('route-preview');
      }

      this.previewMap.fitBounds(bounds, { padding: 60 });
      this.fetchRoutePreview(lon1, lat1, lon2, lat2);
      return;
    }

    // First time — create the map
    this.previewMap = new maplibregl.Map({
      container: this.mapPreviewContainer.nativeElement,
      style: 'https://tiles.openfreemap.org/styles/liberty',
      bounds: bounds,
      fitBoundsOptions: { padding: 60 }
    });

    this.previewMap.addControl(new maplibregl.NavigationControl(), 'top-right');
    this.previewMap.addControl(new maplibregl.FullscreenControl(), 'top-right');

    this.previewMap.on('load', () => {
      this.previewMap?.resize(); // Força resize para corrigir eventuais bugs de tela do maplibre
      this.fetchRoutePreview(lon1, lat1, lon2, lat2);
    });
  }

  private placeMarkers(lon1: number, lat1: number, lon2: number, lat2: number) {
    // Remove existing markers before re-placing them
    if (this.originMarker) {
      this.originMarker.remove();
      this.originMarker = null;
    }
    if (this.destinationMarker) {
      this.destinationMarker.remove();
      this.destinationMarker = null;
    }

    if (!this.previewMap) return;

    // Elemento HTML customizado - Marcador de Origem (Ida - Vermelho)
    const elOrigem = document.createElement('div');
    elOrigem.className = 'marker-origin';
    elOrigem.innerHTML = '<div class="dot"></div>';

    this.originMarker = new maplibregl.Marker({ element: elOrigem })
      .setLngLat([lon1, lat1])
      .setPopup(new maplibregl.Popup({ offset: 15 }).setText('🔴 Ida (Origem): ' + this.checkinForm.value.origem))
      .addTo(this.previewMap);

    // Elemento HTML customizado - Marcador de Destino (Chegada - Verde)
    const elDestino = document.createElement('div');
    elDestino.className = 'marker-destination';
    elDestino.innerHTML = '<div class="dot"></div>';

    this.destinationMarker = new maplibregl.Marker({ element: elDestino })
      .setLngLat([lon2, lat2])
      .setPopup(new maplibregl.Popup({ offset: 15 }).setText('🟢 Chegada (Destino): ' + this.checkinForm.value.destino))
      .addTo(this.previewMap);
  }

  fetchRoutePreview(lon1: number, lat1: number, lon2: number, lat2: number) {
    const url = `https://router.project-osrm.org/route/v1/driving/${lon1},${lat1};${lon2},${lat2}?overview=full&geometries=geojson`;

    this.http.get<any>(url).pipe(
      catchError(() => {
        this.routeLoading = false;
        return of(null);
      })
    ).subscribe(res => {
      this.routeLoading = false;

      if (!res || !res.routes || res.routes.length === 0 || !this.previewMap) return;

      const route = res.routes[0];

      // Update distance and ETA
      this.routeDistance = (route.distance / 1000).toFixed(1) + ' km';
      const etaMins = Math.ceil(route.duration / 60);
      this.routeEta = etaMins > 60
        ? `${Math.floor(etaMins / 60)}h ${etaMins % 60}min`
        : `${etaMins} min`;

      const coordinates = route.geometry.coordinates;

      // Use actual route start and end points for markers to ensure they sit on the road
      const routeLon1 = coordinates[0][0];
      const routeLat1 = coordinates[0][1];
      const routeLon2 = coordinates[coordinates.length - 1][0];
      const routeLat2 = coordinates[coordinates.length - 1][1];
      this.placeMarkers(routeLon1, routeLat1, routeLon2, routeLat2);

      // Add route line to map
      this.previewMap.addSource('route-preview', {
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

      this.previewMap.addLayer({
        id: 'route-preview',
        type: 'line',
        source: 'route-preview',
        layout: {
          'line-join': 'round',
          'line-cap': 'round'
        },
        paint: {
          'line-color': '#1a73e8',
          'line-width': 5,
          'line-opacity': 0.8
        }
      });

      // Fit bounds to the route
      const routeBounds = coordinates.reduce((b: maplibregl.LngLatBounds, coord: [number, number]) => {
        return b.extend(coord);
      }, new maplibregl.LngLatBounds(coordinates[0], coordinates[0]));

      this.previewMap.fitBounds(routeBounds, {
        padding: 60
      });
    });
  }

  onFileSelected(event: Event, key: keyof typeof this.fotos) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) {
      this.fotos[key].file = file;
      const reader = new FileReader();
      reader.onload = () => {
        this.fotos[key].preview = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  async submitCheckin() {
    if (this.checkinForm.invalid) {
      this.checkinForm.markAllAsTouched();
      return;
    }

    // Valida se todas as fotos foram tiradas (desabilitado para facilitar testes)
    const fotosPendentes = Object.values(this.fotos).some(f => !f.file);
    if (fotosPendentes) {
      console.warn('Algumas fotos não foram capturadas. Prosseguindo mesmo assim para fins de teste...');
    }

    this.submitting = true;
    try {
      const session = await this.supabaseService.getCurrentSession();
      if (!session?.user) throw new Error('Usuário não autenticado');

      // 1. Upload das imagens (Comprimindo antes)
      const urls: any = {};
      const folder = `jornadas/${session.user.id}/${Date.now()}`;
      
      for (const [key, data] of Object.entries(this.fotos)) {
        if (data.file) {
          const compressed = await this.storageService.compressImage(data.file);
          const ext = data.file.name.split('.').pop() || 'jpg';
          const path = `${folder}/${key}_in.${ext}`;
          urls[key] = await this.storageService.uploadFile(compressed, path);
        }
      }

      // 2. Criar registro de jornada e checkin
      const formValue = this.checkinForm.value;
      const dataInicio = new Date();
      
      const novaJornada = {
        motorista_id: session.user.id,
        veiculo_id: this.veiculoId,
        origem: formValue.origem,
        destino: formValue.destino,
        status: 'Em andamento',
        iniciado_em: dataInicio.toISOString(),
        chegada_estimada: new Date(dataInicio.getTime() + 60*60*1000).toISOString(), // estimated 1h later
        km_inicial: parseInt(formValue.km_inicial, 10),
        origem_latitude: this.origemLat,
        origem_longitude: this.origemLon,
        destino_latitude: this.destinoLat,
        destino_longitude: this.destinoLon
      };

      const novoCheckin = {
        veiculo_id: this.veiculoId,
        nivel_combustivel: formValue.nivel_combustivel.toString(),
        km: parseInt(formValue.km_inicial, 10),
        foto_painel_uri: urls.foto_painel || '',
        selfie_uri: urls.selfie || '',
        foto_placa_uri: urls.foto_frente || ''
      };

      const jornadaCriada = await this.historicoService.iniciarJornada(novaJornada, novoCheckin);

      // 3. Atualizar Veiculo
      await this.veiculosService.updateVeiculo(this.veiculoId, {
        status: 'Em rota',
        km_atual: parseFloat(formValue.km_inicial),
        nivel_combustivel: parseFloat(formValue.nivel_combustivel),
        responsavel_id: session.user.id
      });

      // 4. Navegar para Jornada Ativa
      this.router.navigate(['/motorista/jornada', jornadaCriada.id]);

    } catch (e) {
      console.error(e);
      alert('Erro ao realizar check-in. Tente novamente.');
    } finally {
      this.submitting = false;
    }
  }
}
