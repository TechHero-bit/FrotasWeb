import { Component, Input, ContentChild, TemplateRef } from '@angular/core';
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
          @for (row of data; track row.id || $index) {
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
    </div>
  `,
  styleUrls: ['./table.component.scss']
})
export class TableComponent {
  @Input() data: any[] = [];
  @Input() columns: TableColumn[] = [];
  @ContentChild('actions') actionsTemplate?: TemplateRef<any>;
}
