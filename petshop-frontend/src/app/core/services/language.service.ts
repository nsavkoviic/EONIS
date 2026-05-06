import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class LanguageService {
  private currentLang = new BehaviorSubject<string>(
    localStorage.getItem('lang') || 'en'
  );
  currentLang$ = this.currentLang.asObservable();

  constructor(private translate: TranslateService) {
    const savedLang = localStorage.getItem('lang') || 'en';
    this.translate.addLangs(['en', 'sr']);
    this.translate.setDefaultLang('en');
    this.translate.use(savedLang);
    this.currentLang.next(savedLang);
  }

  switchLanguage(lang: 'en' | 'sr'): void {
    this.translate.use(lang);
    localStorage.setItem('lang', lang);
    this.currentLang.next(lang);
  }

  getCurrentLang(): string {
    return this.currentLang.getValue();
  }
}
