import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';
import imageCompression from 'browser-image-compression';

@Injectable({
  providedIn: 'root'
})
export class StorageService {
  private readonly BUCKET_NAME = 'evidencias';

  constructor(private supabase: SupabaseService) { }

  async compressImage(file: File): Promise<File> {
    const options = {
      maxSizeMB: 1,
      maxWidthOrHeight: 1280,
      useWebWorker: true,
      fileType: 'image/jpeg'
    };

    try {
      return await imageCompression(file, options);
    } catch (error) {
      console.error('Erro ao comprimir imagem:', error);
      return file; // Se falhar a compressão, tenta com o original
    }
  }

  async uploadFile(file: File, path: string): Promise<string> {
    const { data, error } = await this.supabase.client
      .storage
      .from(this.BUCKET_NAME)
      .upload(path, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      throw error;
    }

    const { data: publicUrlData } = this.supabase.client
      .storage
      .from(this.BUCKET_NAME)
      .getPublicUrl(path);

    return publicUrlData.publicUrl;
  }
}
