import { Component, OnInit, OnDestroy, AfterViewInit, ElementRef, ViewChild, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule, DatePipe, Location } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { HistoricoService, Jornada } from '../../core/services/historico.service';
import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

interface PhotoSlot {
  label: string;
  uri?: string;
  loaded?: boolean;
}

@Component({
  selector: 'app-historico-detalhes',
  standalone: true,
  imports: [CommonModule],
  providers: [DatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
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
              <h4 class="section-title">Check-in</h4>
              <div class="photos-grid mb-3">
                @for (photo of checkinPhotos; track photo.label) {
                  <div class="photo-item">
                    @if (photo.uri) {
                      <div class="img-wrapper">
                        <div class="skeleton" *ngIf="!photo.loaded"></div>
                        <img [src]="photo.uri" [alt]="photo.label" loading="lazy" (load)="photo.loaded = true" [style.opacity]="photo.loaded ? 1 : 0">
                      </div>
                    } @else {
                      <div class="photo-placeholder">
                        <span class="text-muted">Foto não registrada</span>
                      </div>
                    }
                    <span class="photo-caption">{{ photo.label }}</span>
                  </div>
                }
              </div>

              <h4 class="section-title">Check-out</h4>
              <div class="photos-grid">
                @for (photo of checkoutPhotos; track photo.label) {
                  <div class="photo-item">
                    @if (photo.uri) {
                      <div class="img-wrapper">
                        <div class="skeleton" *ngIf="!photo.loaded"></div>
                        <img [src]="photo.uri" [alt]="photo.label" loading="lazy" (load)="photo.loaded = true" [style.opacity]="photo.loaded ? 1 : 0">
                      </div>
                    } @else {
                      <div class="photo-placeholder">
                        <span class="text-muted">Foto não registrada</span>
                      </div>
                    }
                    <span class="photo-caption">{{ photo.label }}</span>
                  </div>
                }
              </div>
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

  checkinPhotos: PhotoSlot[] = [];
  checkoutPhotos: PhotoSlot[] = [];

  @ViewChild('mapContainer') private mapContainer!: ElementRef<HTMLElement>;
  private map: maplibregl.Map | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private location: Location,
    private historicoService: HistoricoService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.loadJornadaDetails(id);
      } else {
        this.error = 'ID da jornada não fornecido.';
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }

  async loadJornadaDetails(id: string) {
    try {
      this.loading = true;
      this.cdr.markForCheck();
      const jornadas = await this.historicoService.getJornadas();
      const jornada = jornadas.find(j => j.id.toString() === id.toString());
      
      if (jornada) {
        this.jornada = jornada;
        this.buildPhotoSlots();
      } else {
        this.error = 'Jornada não encontrada.';
      }
    } catch (err: any) {
      this.error = 'Erro ao carregar detalhes: ' + err.message;
    } finally {
      this.loading = false;
      this.cdr.markForCheck();
      if (this.jornada) {
        setTimeout(() => this.initMap(), 100);
      }
    }
  }

  buildPhotoSlots() {
    if (!this.jornada) return;

    // Build Check-in Slots
    const cin = this.jornada.checkins && this.jornada.checkins.length > 0 ? this.jornada.checkins[0] : null;
    this.checkinPhotos = [
      { label: 'Painel', uri: cin?.foto_painel_uri },
      { label: 'Selfie', uri: cin?.selfie_uri },
      { label: 'Frente', uri: cin?.foto_frente_uri },
      { label: 'Lat. Direita', uri: cin?.foto_lateral_direita_uri },
      { label: 'Lat. Esquerda', uri: cin?.foto_lateral_esquerda_uri },
      { label: 'Traseira', uri: cin?.foto_traseira_uri || cin?.foto_placa_uri },
    ];

    // Build Check-out Slots
    const cout = this.jornada.checkouts && this.jornada.checkouts.length > 0 ? this.jornada.checkouts[0] : null;
    this.checkoutPhotos = [
      { label: 'Painel', uri: cout?.foto_painel_uri },
      { label: 'Selfie', uri: cout?.selfie_uri },
      { label: 'Frente', uri: cout?.foto_frente_uri },
      { label: 'Lat. Direita', uri: cout?.foto_lateral_direita_uri },
      { label: 'Lat. Esquerda', uri: cout?.foto_lateral_esquerda_uri },
      { label: 'Traseira', uri: cout?.foto_traseira_uri || cout?.foto_veiculo_uri },
    ];
  }

  ngAfterViewInit() {
    // Initialization of map is handled after data loads
  }

  initMap() {
    if (!this.mapContainer || this.map) return;

    this.map = new maplibregl.Map({
      container: this.mapContainer.nativeElement,
      style: 'https://tiles.openfreemap.org/styles/liberty', // OpenFreeMap style
      center: [-43.18, -22.92], // Default fallback
      zoom: 12,
      attributionControl: false
    });

    this.map.addControl(new maplibregl.NavigationControl(), 'top-right');
    this.map.addControl(new maplibregl.FullscreenControl(), 'top-right');

    // Simulate database coordinates based on origin/destination
    // If coords are in the DB in the future, just replace these with jornada.origem_lat etc.
    const origin: [number, number] = [-43.18223, -22.90642]; // Centro RJ
    const destination: [number, number] = [-43.1755, -22.9688]; // Copacabana

    new maplibregl.Marker({ color: '#6C757D' })
      .setLngLat(origin)
      .setPopup(new maplibregl.Popup({ offset: 25 }).setHTML('<h5>Origem</h5><p>' + (this.jornada?.origem || '') + '</p>'))
      .addTo(this.map);

    new maplibregl.Marker({ color: '#28A745' })
      .setLngLat(destination)
      .setPopup(new maplibregl.Popup({ offset: 25 }).setHTML('<h5>Destino</h5><p>' + (this.jornada?.destino || '') + '</p>'))
      .addTo(this.map);

    const bounds = new maplibregl.LngLatBounds()
      .extend(origin)
      .extend(destination);
    
    this.map.fitBounds(bounds, { padding: 50, maxZoom: 15 });
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

