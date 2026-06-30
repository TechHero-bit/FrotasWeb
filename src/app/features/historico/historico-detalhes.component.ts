import { Component, OnInit, OnDestroy, AfterViewInit, ElementRef, ViewChild } from '@angular/core';
import { CommonModule, DatePipe, Location } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { HistoricoService, Jornada } from '../../core/services/historico.service';
import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

@Component({
  selector: 'app-historico-detalhes',
  standalone: true,
  imports: [CommonModule],
  providers: [DatePipe],
  template: `
    <div class="header d-flex align-items-center gap-3 mb-4">
      <button class="btn btn-outline btn-icon" (click)="voltar()" title="Voltar">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="m15 18-6-6 6-6"/>
        </svg>
      </button>
      <h2 style="margin: 0; color: var(--color-primary);">Detalhes da Corrida</h2>
    </div>

    @if (loading) {
      <div class="text-center mt-5 text-muted">
        Carregando detalhes...
      </div>
    } @else if (error) {
      <div class="alert alert-danger">{{ error }}</div>
    } @else if (jornada) {
      <div class="details-grid">
        <!-- Coluna Esquerda: Informações e Mapa -->
        <div class="main-info-col">
          <!-- Card Motorista / Veículo -->
          <div class="info-card mb-4">
            <div class="card-header">
              <h3>Informações Principais</h3>
              <span class="status-badge" [ngClass]="getStatusBadgeClass(jornada.status)">{{ jornada.status }}</span>
            </div>
            <div class="card-body">
              <div class="info-row">
                <div class="info-group">
                  <span class="label">Motorista</span>
                  <span class="value">{{ jornada.motorista_nome }}</span>
                </div>
                <div class="info-group">
                  <span class="label">Veículo</span>
                  <span class="value">{{ jornada.veiculo_placa }}</span>
                </div>
              </div>
              <div class="info-row mt-3">
                <div class="info-group">
                  <span class="label">Início</span>
                  <span class="value">{{ jornada.hora_inicio ? (jornada.hora_inicio | date:'short') : 'N/A' }}</span>
                </div>
                <div class="info-group">
                  <span class="label">Término</span>
                  <span class="value">{{ jornada.hora_fim ? (jornada.hora_fim | date:'short') : 'N/A' }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Mapa do Trajeto -->
          <div class="map-card mb-4">
            <div class="card-header">
              <h3>Trajeto (Origem e Destino)</h3>
            </div>
            <div class="card-body map-body">
              <div class="route-info mb-3">
                <div class="route-point">
                  <span class="dot origin"></span>
                  <span class="address">{{ jornada.origem || 'Não informada' }}</span>
                </div>
                <div class="route-line"></div>
                <div class="route-point">
                  <span class="dot destination"></span>
                  <span class="address">{{ jornada.destino || 'Não informada' }}</span>
                </div>
              </div>
              <div class="map-container-wrapper">
                <div class="map-container" #mapContainer></div>
              </div>
            </div>
          </div>
        </div>

        <!-- Coluna Direita: Fotos e Observações -->
        <div class="side-info-col">
          <div class="gallery-card mb-4">
            <div class="card-header">
              <h3>Galeria de Evidências</h3>
            </div>
            <div class="card-body">
              @if (jornada.checkins && jornada.checkins.length > 0) {
                <h4 class="section-title">Check-in</h4>
                <div class="photos-grid mb-3">
                  @if (jornada.checkins[0].selfie_uri) {
                    <div class="photo-item">
                      <img [src]="jornada.checkins[0].selfie_uri" alt="Selfie Check-in">
                      <span class="photo-caption">Selfie</span>
                    </div>
                  }
                  @if (jornada.checkins[0].foto_placa_uri) {
                    <div class="photo-item">
                      <img [src]="jornada.checkins[0].foto_placa_uri" alt="Placa Check-in">
                      <span class="photo-caption">Placa</span>
                    </div>
                  }
                </div>
              }

              @if (jornada.checkouts && jornada.checkouts.length > 0) {
                <h4 class="section-title">Check-out</h4>
                <div class="photos-grid">
                  @if (jornada.checkouts[0].selfie_uri) {
                    <div class="photo-item">
                      <img [src]="jornada.checkouts[0].selfie_uri" alt="Selfie Check-out">
                      <span class="photo-caption">Selfie</span>
                    </div>
                  }
                  @if (jornada.checkouts[0].foto_veiculo_uri) {
                    <div class="photo-item">
                      <img [src]="jornada.checkouts[0].foto_veiculo_uri" alt="Veículo Check-out">
                      <span class="photo-caption">Veículo</span>
                    </div>
                  }
                </div>
              }

              @if ((!jornada.checkins || jornada.checkins.length === 0) && (!jornada.checkouts || jornada.checkouts.length === 0)) {
                <p class="text-muted text-center py-4">Nenhuma evidência fotográfica disponível.</p>
              }
            </div>
          </div>

          @if (jornada.checkouts && jornada.checkouts.length > 0 && jornada.checkouts[0].observacoes) {
            <div class="obs-card">
              <div class="card-header">
                <h3>Observações do Check-out</h3>
              </div>
              <div class="card-body">
                <p class="obs-text">{{ jornada.checkouts[0].observacoes }}</p>
              </div>
            </div>
          }
        </div>
      </div>
    }
  `,
  styleUrls: ['./historico-detalhes.component.scss']
})
export class HistoricoDetalhesComponent implements OnInit, AfterViewInit, OnDestroy {
  jornada: Jornada | null = null;
  loading = true;
  error: string | null = null;

  @ViewChild('mapContainer') private mapContainer!: ElementRef<HTMLElement>;
  private map: maplibregl.Map | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private location: Location,
    private historicoService: HistoricoService
  ) {}

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.loadJornadaDetails(id);
      } else {
        this.error = 'ID da jornada não fornecido.';
        this.loading = false;
      }
    });
  }

  async loadJornadaDetails(id: string) {
    try {
      this.loading = true;
      const jornadas = await this.historicoService.getJornadas();
      const jornada = jornadas.find(j => j.id === id);
      
      if (jornada) {
        this.jornada = jornada;
      } else {
        this.error = 'Jornada não encontrada.';
      }
    } catch (err: any) {
      this.error = 'Erro ao carregar detalhes: ' + err.message;
    } finally {
      this.loading = false;
      if (this.jornada) {
        // Wait a tick for the view child to be rendered
        setTimeout(() => this.initMap(), 100);
      }
    }
  }

  ngAfterViewInit() {
    // Initialization of map is handled after data loads
  }

  initMap() {
    if (!this.mapContainer || this.map) return;

    // São Paulo default center
    const defaultCenter: [number, number] = [-46.6333, -23.5505];

    this.map = new maplibregl.Map({
      container: this.mapContainer.nativeElement,
      style: 'https://tiles.openfreemap.org/styles/liberty', // OpenFreeMap style
      center: defaultCenter,
      zoom: 12,
      attributionControl: false
    });

    this.map.addControl(new maplibregl.NavigationControl(), 'top-right');

    new maplibregl.Marker({ color: '#B91C1C' })
      .setLngLat(defaultCenter)
      .setPopup(new maplibregl.Popup().setHTML('<h5>Ponto de Referência</h5>'))
      .addTo(this.map);
  }

  ngOnDestroy() {
    if (this.map) {
      this.map.remove();
    }
  }

  voltar() {
    this.location.back();
  }

  getStatusBadgeClass(status: string): string {
    const s = (status || '').toLowerCase().normalize('NFD').replace(/[\\u0300-\\u036f]/g, '');
    if (s === 'pendente' || s === 'nao iniciada') return 'badge-pending';
    if (s === 'em andamento' || s === 'andamento') return 'badge-progress';
    return 'badge-done';
  }
}
