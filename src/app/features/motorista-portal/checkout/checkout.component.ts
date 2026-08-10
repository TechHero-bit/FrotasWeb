import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { VeiculosService } from '../../../core/services/veiculos.service';
import { HistoricoService, Jornada } from '../../../core/services/historico.service';
import { StorageService } from '../../../core/services/storage.service';
import { SupabaseService } from '../../../core/services/supabase.service';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './checkout.component.html',
  styleUrl: './checkout.component.scss'
})
export class CheckoutComponent implements OnInit {
  jornadaId: string = '';
  jornada: Jornada | null = null;
  loading = true;
  submitting = false;
  
  checkoutForm: FormGroup;
  
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
    private veiculosService: VeiculosService,
    private historicoService: HistoricoService,
    private storageService: StorageService,
    private supabaseService: SupabaseService
  ) {
    this.checkoutForm = this.fb.group({
      km_final: ['', [Validators.required, Validators.min(0)]],
      nivel_combustivel: ['100', Validators.required],
      observacoes: ['']
    });
  }

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      this.jornadaId = params.get('id') || '';
      if (this.jornadaId) {
        this.loadJornada();
      }
    });
  }

  async loadJornada() {
    this.loading = true;
    try {
      this.jornada = await this.historicoService.getJornadaById(this.jornadaId);
      if (this.jornada && this.jornada.veiculos) {
        // Pre-fill with current KM if available
        this.checkoutForm.patchValue({
          km_final: this.jornada.veiculos.km_atual
        });
      }
    } catch (e) {
      console.error(e);
      alert('Erro ao carregar os dados da jornada.');
    } finally {
      this.loading = false;
    }
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

  async submitCheckout() {
    if (this.checkoutForm.invalid || !this.jornada) {
      this.checkoutForm.markAllAsTouched();
      return;
    }

    // Validação de fotos
    const fotosPendentes = Object.values(this.fotos).some(f => !f.file);
    if (fotosPendentes) {
      alert('Por favor, capture todas as fotos obrigatórias da vistoria de devolução.');
      return;
    }

    const formValue = this.checkoutForm.value;
    
    // Validar KM final >= KM atual do veículo
    if (this.jornada.veiculos && this.jornada.veiculos.km_atual !== undefined) {
       if (parseFloat(formValue.km_final) < this.jornada.veiculos.km_atual) {
         alert('O KM Final não pode ser menor que o KM Inicial da jornada.');
         return;
       }
    }

    this.submitting = true;
    try {
      const session = await this.supabaseService.getCurrentSession();
      if (!session?.user) throw new Error('Usuário não autenticado');

      // 1. Upload das imagens (Comprimindo antes)
      const urls: any = {};
      const folder = `jornadas/${session.user.id}/${Date.now()}`;
      
      const uploadErrors: Array<{ key: string; error: any }> = [];
      for (const [key, data] of Object.entries(this.fotos)) {
        if (data.file) {
          try {
            const compressed = await this.storageService.compressImage(data.file);
            const ext = data.file.name.split('.').pop() || 'jpg';
            const path = `${folder}/${key}_out.${ext}`;
            urls[key] = await this.storageService.uploadFile(compressed, path);
          } catch (err) {
            console.error('Falha ao enviar arquivo', key, err);
            uploadErrors.push({ key, error: err });
            urls[key] = '';
          }
        }
      }

      if (uploadErrors.length > 0) {
        const failed = uploadErrors.map(u => u.key).join(', ');
        throw new Error(`Falha no upload das imagens: ${failed}`);
      }

      // 2. Checkout data
      const novoCheckout = {
        veiculo_id: this.jornada.veiculo_id,
        nivel_combustivel: formValue.nivel_combustivel.toString(),
        foto_painel_uri: urls.foto_painel || '',
        selfie_uri: urls.selfie || '',
        foto_frente_uri: urls.foto_frente || '',
        foto_traseira_uri: urls.foto_traseira || '',
        foto_lateral_esquerda_uri: urls.foto_lateral_esquerda || '',
        foto_lateral_direita_uri: urls.foto_lateral_direita || '',
        observacoes: formValue.observacoes
      };

      await this.historicoService.finalizarJornada(this.jornadaId, novoCheckout, parseFloat(formValue.km_final));

      // 3. Atualizar Veiculo para Disponível
      await this.veiculosService.updateVeiculo(this.jornada.veiculo_id, {
        status: 'Disponível',
        km_atual: parseFloat(formValue.km_final),
        nivel_combustivel: parseFloat(formValue.nivel_combustivel),
        responsavel_id: undefined // Remove o responsável atual
      });

      // 4. Navegar para Home
      this.router.navigate(['/motorista/home']);

    } catch (e: any) {
      console.error(e);
      alert('Erro ao finalizar a jornada: ' + (e?.message || JSON.stringify(e)));
    } finally {
      this.submitting = false;
    }
  }
}
