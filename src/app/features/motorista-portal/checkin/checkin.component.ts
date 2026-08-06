import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Subject, debounceTime, distinctUntilChanged, switchMap, of, catchError } from 'rxjs';

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
export class CheckinComponent implements OnInit {
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
      }
    });

    this.setupAutocomplete();
  }

  async loadVeiculo() {
    this.loading = true;
    try {
      const veiculos = await this.veiculosService.getVeiculos();
      this.veiculo = veiculos.find(v => v.id === this.veiculoId) || null;
      if (this.veiculo) {
        this.checkinForm.patchValue({
          km_inicial: this.veiculo.km_atual,
          nivel_combustivel: this.veiculo.nivel_combustivel.toString()
        });
      }
    } catch (e) {
      console.error(e);
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
    const url = `https://api.locationiq.com/v1/autocomplete.php?key=${LOCATIONIQ_TOKEN}&q=${encodeURIComponent(term)}&countrycodes=br&limit=5&addressdetails=1&format=json`;
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
  }

  selectDestino(result: any) {
    this.checkinForm.patchValue({ destino: result.display_name });
    this.destinoLat = parseFloat(result.lat);
    this.destinoLon = parseFloat(result.lon);
    this.showDestinoResults = false;
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

    // Valida se todas as fotos foram tiradas
    const fotosPendentes = Object.values(this.fotos).some(f => !f.file);
    if (fotosPendentes) {
      alert('Por favor, capture todas as fotos obrigatórias da vistoria.');
      return;
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
        usuario_id: session.user.id,
        veiculo_id: this.veiculoId,
        origem: formValue.origem,
        destino: formValue.destino,
        status: 'Em andamento',
        iniciado_em: dataInicio.toISOString(),
        hora_inicio: dataInicio.toLocaleTimeString('pt-BR'),
        origem_latitude: this.origemLat,
        origem_longitude: this.origemLon,
        destino_latitude: this.destinoLat,
        destino_longitude: this.destinoLon
      };

      const novoCheckin = {
        foto_painel_uri: urls.foto_painel,
        selfie_uri: urls.selfie,
        foto_frente_uri: urls.foto_frente,
        foto_traseira_uri: urls.foto_traseira,
        foto_lateral_esquerda_uri: urls.foto_lateral_esquerda,
        foto_lateral_direita_uri: urls.foto_lateral_direita
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
      this.router.navigate(['/motorista/jornada-ativa', jornadaCriada.id]);

    } catch (e) {
      console.error(e);
      alert('Erro ao realizar check-in. Tente novamente.');
    } finally {
      this.submitting = false;
    }
  }
}
