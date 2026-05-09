import { Injectable } from '@angular/core';
import { MatPaginatorIntl } from '@angular/material/paginator';
import { TranslateService } from '@ngx-translate/core';
import { Subject } from 'rxjs';

@Injectable()
export class PaginatorIntlService extends MatPaginatorIntl {
  override changes = new Subject<void>();

  constructor(private translate: TranslateService) {
    super();
    this.translate.onLangChange.subscribe(() => {
      this.updateLabels();
      this.changes.next();
    });
    this.updateLabels();
  }

  private updateLabels(): void {
    this.itemsPerPageLabel = 
      this.translate.instant('PRODUCTS.ITEMS_PER_PAGE');
    this.nextPageLabel = 
      this.translate.instant('COMMON.NEXT');
    this.previousPageLabel = 
      this.translate.instant('COMMON.BACK');
  }

  override getRangeLabel = 
    (page: number, pageSize: number, length: number): string => {
      if (length === 0) return '0';
      const start = page * pageSize + 1;
      const end = Math.min((page + 1) * pageSize, length);
      return `${start} – ${end} ${this.translate.instant('PRODUCTS.PAGE_OF')} ${length}`;
    };
}
