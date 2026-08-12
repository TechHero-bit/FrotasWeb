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
  error?: boolean;
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
                  <span class="value">{{ jornada.iniciado_em ? (jornada.iniciado_em | date:'short') : 'N/A' }}</span>
                </div>
                <div class="info-group">
                  <span class="label">Término</span>
                  <span class="value">{{ jornada.encerrado_em ? (jornada.encerrado_em | date:'short') : 'N/A' }}</span>
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

          @if (jornada.checkouts && jornada.checkouts.length > 0 && jornada.checkouts[0].observacoes) {
            <div class="obs-card mb-4" style="width: 100%;">
              <div class="card-header">
                <h3>Observações do Check-out</h3>
              </div>
              <div class="card-body">
                <p class="obs-text" style="min-height: 120px; font-size: 1rem;">{{ jornada.checkouts[0].observacoes }}</p>
              </div>
            </div>
          }
        </div>

        <!-- Coluna Direita: Fotos e Observações -->
        <div class="side-info-col">
          <div class="gallery-card mb-4">
            <div class="card-header gallery-header">
              <div class="d-flex align-items-center justify-content-between w-100">
                <h3>Galeria de Evidências</h3>
                <button type="button" class="toggle-slots-btn" (click)="showOnlyRegistered = !showOnlyRegistered">
                  {{ showOnlyRegistered ? 'Exibir todos os slots' : 'Apenas registradas' }}
                </button>
              </div>
              <div class="gallery-tabs">
                <button type="button" class="tab-btn" [class.active]="activeTab === 'all'" (click)="activeTab = 'all'">
                  Todas ({{ countPhotos(checkinPhotos) + countPhotos(checkoutPhotos) }})
                </button>
                <button type="button" class="tab-btn" [class.active]="activeTab === 'checkin'" (click)="activeTab = 'checkin'">
                  Check-in ({{ countPhotos(checkinPhotos) }})
                </button>
                <button type="button" class="tab-btn" [class.active]="activeTab === 'checkout'" (click)="activeTab = 'checkout'">
                  Check-out ({{ countPhotos(checkoutPhotos) }})
                </button>
              </div>
            </div>
            <div class="card-body gallery-body">
              @if (activeTab === 'checkin' || activeTab === 'all') {
                <div class="section-header">
                  <h4 class="section-title">Check-in</h4>
                  <span class="badge-count">{{ countPhotos(checkinPhotos) }}/6 fotos</span>
                </div>
                
                @if (getVisiblePhotos(checkinPhotos).length === 0) {
                  <div class="no-photos-alert">
                    <span>Nenhuma foto registrada no Check-in</span>
                  </div>
                } @else {
                  <div class="photos-grid mb-4">
                    @for (photo of getVisiblePhotos(checkinPhotos); track photo.label) {
                      <div class="photo-item">
                        @if (photo.uri && !photo.error) {
                          <div class="img-wrapper" (click)="expandPhoto(photo.uri)" style="cursor: pointer;" title="Clique para expandir">
                            <div class="skeleton" *ngIf="!photo.loaded"></div>
                            <img [src]="photo.uri" [alt]="photo.label" loading="lazy" decoding="async" (load)="photo.loaded = true" (error)="photo.error = true" [style.opacity]="photo.loaded ? 1 : 0">
                          </div>
                        } @else {
                          <div class="photo-placeholder">
                            <span class="text-muted">Sem foto</span>
                          </div>
                        }
                        <span class="photo-caption">{{ photo.label }}</span>
                      </div>
                    }
                  </div>
                }
              }

              @if (activeTab === 'checkout' || activeTab === 'all') {
                <div class="section-header">
                  <h4 class="section-title">Check-out</h4>
                  <span class="badge-count">{{ countPhotos(checkoutPhotos) }}/6 fotos</span>
                </div>

                @if (getVisiblePhotos(checkoutPhotos).length === 0) {
                  <div class="no-photos-alert">
                    <span>Nenhuma foto registrada no Check-out</span>
                  </div>
                } @else {
                  <div class="photos-grid">
                    @for (photo of getVisiblePhotos(checkoutPhotos); track photo.label) {
                      <div class="photo-item">
                        @if (photo.uri && !photo.error) {
                          <div class="img-wrapper" (click)="expandPhoto(photo.uri)" style="cursor: pointer;" title="Clique para expandir">
                            <div class="skeleton" *ngIf="!photo.loaded"></div>
                            <img [src]="photo.uri" [alt]="photo.label" loading="lazy" decoding="async" (load)="photo.loaded = true" (error)="photo.error = true" [style.opacity]="photo.loaded ? 1 : 0">
                          </div>
                        } @else {
                          <div class="photo-placeholder">
                            <span class="text-muted">Sem foto</span>
                          </div>
                        }
                        <span class="photo-caption">{{ photo.label }}</span>
                      </div>
                    }
                  </div>
                }
              }
            </div>
          </div>
        </div>
      </div>
    }

    @if (expandedPhoto) {
      <div class="photo-modal" (click)="expandedPhoto = null">
        <button class="btn-close" (click)="expandedPhoto = null" title="Fechar">✕</button>
        <img [src]="expandedPhoto" (click)="$event.stopPropagation()">
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
  expandedPhoto: string | null = null;
  activeTab: 'all' | 'checkin' | 'checkout' = 'all';
  showOnlyRegistered = true;

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
    if (this.map) {
      this.map.remove();
      this.map = null;
    }
    try {
      this.loading = true;
      this.cdr.detectChanges();
      
      // Carrega DIRETO pelo ID (sem baixar a tabela inteira do banco)
      const jornada = await this.historicoService.getJornadaById(id);
      
      if (jornada) {
        this.jornada = jornada;
        this.buildPhotoSlots();
      } else {
        this.error = 'Jornada não encontrada.';
      }
    } catch (err: any) {
      this.error = 'Erro ao carregar detalhes: ' + (err.message || 'Falha na requisição.');
    } finally {
      this.loading = false;
      this.cdr.detectChanges();
      if (this.jornada) {
        setTimeout(() => this.initMap(), 50);
      }
    }
  }

  buildPhotoSlots() {
    if (!this.jornada) return;

    const parseVehiclePhotos = (record: any, mainPlacaUri?: string) => {
      let frente = record?.foto_frente_uri;
      let latEsq = record?.foto_lateral_esquerda_uri;
      let latDir = record?.foto_lateral_direita_uri;
      let traseira = record?.foto_traseira_uri;

      // Fallback para registros antigos ou strings concatenadas por vírgula
      if ((!frente || !latEsq || !latDir || !traseira) && mainPlacaUri) {
        const splitUrls = mainPlacaUri.split(',').map(s => s.trim()).filter(Boolean);
        if (splitUrls.length > 0) {
          if (!frente) frente = splitUrls[0];
          if (!latEsq) latEsq = splitUrls[1];
          if (!latDir) latDir = splitUrls[2];
          if (!traseira) traseira = splitUrls[3];
        }
      }

      return { frente, latEsq, latDir, traseira };
    };

    // Build Check-in Slots
    const cin = this.jornada.checkins && this.jornada.checkins.length > 0 ? this.jornada.checkins[0] : null;
    const cinVehicle = parseVehiclePhotos(cin, (cin as any)?.foto_placa_uri);

    this.checkinPhotos = [
      { label: 'Painel', uri: cin?.foto_painel_uri },
      { label: 'Selfie', uri: cin?.selfie_uri },
      { label: 'Frente', uri: cinVehicle.frente },
      { label: 'Lat. Direita', uri: cinVehicle.latDir },
      { label: 'Lat. Esquerda', uri: cinVehicle.latEsq },
      { label: 'Traseira', uri: cinVehicle.traseira }
    ];

    // Build Check-out Slots
    const cout = this.jornada.checkouts && this.jornada.checkouts.length > 0 ? this.jornada.checkouts[0] : null;
    const coutVehicle = parseVehiclePhotos(cout, (cout as any)?.foto_veiculo_uri);

    this.checkoutPhotos = [
      { label: 'Painel', uri: cout?.foto_painel_uri },
      { label: 'Selfie', uri: cout?.selfie_uri },
      { label: 'Frente', uri: coutVehicle.frente },
      { label: 'Lat. Direita', uri: coutVehicle.latDir },
      { label: 'Lat. Esquerda', uri: coutVehicle.latEsq },
      { label: 'Traseira', uri: coutVehicle.traseira }
    ];
  }

  getVisiblePhotos(photos: PhotoSlot[]): PhotoSlot[] {
    if (this.showOnlyRegistered) {
      const registered = photos.filter(p => !!p.uri && !p.error);
      // Se tiver pelo menos 1 foto enviada, mostra só as enviadas. Caso contrário mostra os slots
      return registered.length > 0 ? registered : photos;
    }
    return photos;
  }

  countPhotos(photos: PhotoSlot[]): number {
    return photos.filter(p => !!p.uri && !p.error).length;
  }

  expandPhoto(uri?: string) {
    if (uri) {
      this.expandedPhoto = uri;
      this.cdr.markForCheck();
    }
  }

  ngAfterViewInit() {
    // Initialization of map is handled after data loads
  }

  async initMap() {
    if (!this.mapContainer) return;

    if (this.map) {
      this.map.remove();
      this.map = null;
    }

    let originLng = this.jornada?.origem_longitude ? Number(this.jornada.origem_longitude) : null;
    let originLat = this.jornada?.origem_latitude ? Number(this.jornada.origem_latitude) : null;
    let destLng = this.jornada?.destino_longitude ? Number(this.jornada.destino_longitude) : null;
    let destLat = this.jornada?.destino_latitude ? Number(this.jornada.destino_latitude) : null;

    // Helper para verificar se a coordenada é válida dentro do Brasil
    const isBrazilCoord = (lng: number | null, lat: number | null) =>
      lng !== null && lat !== null && lat >= -34 && lat <= 5 && lng >= -74 && lng <= -34;

    if (!isBrazilCoord(originLng, originLat)) {
      originLng = null;
      originLat = null;
    }
    if (!isBrazilCoord(destLng, destLat)) {
      destLng = null;
      destLat = null;
    }

    // Se não tiver coordenadas válidas do Brasil, executa geocoding em PARALELO para máxima velocidade
    const geocodePromises: Promise<void>[] = [];

    if ((!originLng || !originLat) && this.jornada?.origem) {
      geocodePromises.push(this.geocode(this.jornada.origem).then(coords => {
        if (coords) { originLng = coords[0]; originLat = coords[1]; }
      }));
    }
    if ((!destLng || !destLat) && this.jornada?.destino) {
      geocodePromises.push(this.geocode(this.jornada.destino).then(coords => {
        if (coords) { destLng = coords[0]; destLat = coords[1]; }
      }));
    }

    if (geocodePromises.length > 0) {
      await Promise.all(geocodePromises);
    }

    // Fallback final se tudo falhar (Centro do RJ -> Copacabana)
    const origin: [number, number] = (originLng && originLat) ? [originLng, originLat] : [-43.18223, -22.90642];
    const destination: [number, number] = (destLng && destLat) ? [destLng, destLat] : [-43.1755, -22.9688];

    this.map = new maplibregl.Map({
      container: this.mapContainer.nativeElement,
      style: 'https://tiles.openfreemap.org/styles/liberty', // OpenFreeMap style
      center: origin,
      zoom: 12,
      attributionControl: false
    });

    this.map.addControl(new maplibregl.NavigationControl(), 'top-right');
    this.map.addControl(new maplibregl.FullscreenControl(), 'top-right');

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

    // Try to fetch and draw the polyline route
    this.map.on('load', async () => {
      try {
        const url = `https://router.project-osrm.org/route/v1/driving/${origin[0]},${origin[1]};${destination[0]},${destination[1]}?overview=full&geometries=geojson&steps=false`;
        const response = await fetch(url);
        if (response.ok) {
          const data = await response.json();
          if (data.routes && data.routes.length > 0) {
            const geometry = data.routes[0].geometry;
            if (this.map) {
              this.map.addSource('route', { type: 'geojson', data: geometry });
              this.map.addLayer({
                id: 'route-line',
                type: 'line',
                source: 'route',
                layout: { 'line-join': 'round', 'line-cap': 'round' },
                paint: { 'line-color': '#0d6efd', 'line-width': 5, 'line-opacity': 0.8 }
              });
            }
          }
        }
      } catch (e) {
        console.warn('Erro ao buscar a polyline da rota OSRM', e);
      }
    });
  }

  async geocode(address: string): Promise<[number, number] | null> {
    if (!address || !address.trim()) return null;
    try {
      // Limpa sufixos redundantes e ruídos do autocomplete
      let query = address.split('-')[0].trim();
      if (!query.toLowerCase().includes('brasil')) {
        query += ', Brasil';
      }

      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=br&limit=1`;
      const res = await fetch(url, { headers: { 'Accept-Language': 'pt-BR' } });
      const data = await res.json();
      if (data && data.length > 0) {
        const lon = Number(data[0].lon);
        const lat = Number(data[0].lat);
        if (lat >= -34 && lat <= 5 && lon >= -74 && lon <= -34) {
          return [lon, lat];
        }
      }
    } catch (e) {
      console.warn('Erro ao buscar coordenadas para o endereço:', address, e);
    }
    return null;
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

