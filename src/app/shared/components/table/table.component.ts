import { Component, Input, ContentChild, TemplateRef, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface TableColumn {
  key: string;
  label: string;
  format?: (value: any) => string;
}

@Component({
  selector: 'app-table',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="table-container">
      <table class="data-table">
        <thead>
          <tr>
            @for (col of columns; track col.key) {
              <th>{{ col.label }}</th>
            }
            @if (actionsTemplate) {
              <th>Ações</th>
            }
          </tr>
        </thead>
        <tbody>
          @for (row of paginatedData; track row.id || $index) {
            <tr>
              @for (col of columns; track col.key) {
                <td>{{ col.format ? col.format(row[col.key]) : row[col.key] }}</td>
              }
              @if (actionsTemplate) {
                <td class="actions-cell">
                  <ng-container *ngTemplateOutlet="actionsTemplate; context: { $implicit: row }"></ng-container>
                </td>
              }
            </tr>
          }
          @if (data.length === 0) {
            <tr>
              <td [attr.colspan]="columns.length + (actionsTemplate ? 1 : 0)" class="text-center empty-state">
                Nenhum registro encontrado.
              </td>
            </tr>
          }
        </tbody>
      </table>
      @if (totalPages > 1) {
        <div class="pagination-controls">
          <button class="btn-page" [disabled]="currentPage === 1" (click)="prevPage()">Anterior</button>
          <span class="page-info">Página {{ currentPage }} de {{ totalPages }}</span>
          <button class="btn-page" [disabled]="currentPage === totalPages" (click)="nextPage()">Próximo</button>
        </div>
      }
    </div>
  `,
  styleUrls: ['./table.component.scss']
})
export class TableComponent implements OnChanges {
  @Input() data: any[] = [];
  @Input() columns: TableColumn[] = [];
  @Input() pageSize: number = 10;
  @ContentChild('actions') actionsTemplate?: TemplateRef<any>;

  currentPage = 1;

  get totalPages(): number {
    return Math.ceil(this.data.length / this.pageSize) || 1;
  }

  get paginatedData(): any[] {
    const startIndex = (this.currentPage - 1) * this.pageSize;
    return this.data.slice(startIndex, startIndex + this.pageSize);
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['data']) {
      this.currentPage = 1;
    }
  }

  prevPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
    }
  }

  nextPage() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
    }
  }
}
