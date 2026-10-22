import { Injectable, effect, signal } from '@angular/core';

export type ThemeMode = 'light' | 'dark';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly storageKey = 'ast-theme';

  readonly mode = signal<ThemeMode>(this.initialMode());

  constructor() {
    effect(() => {
      const mode = this.mode();
      document.documentElement.setAttribute('data-theme', mode);
      localStorage.setItem(this.storageKey, mode);
    });
  }

  toggle(): void {
    this.mode.update((m) => (m === 'light' ? 'dark' : 'light'));
  }

  private initialMode(): ThemeMode {
    const saved = localStorage.getItem(this.storageKey);
    if (saved === 'light' || saved === 'dark') return saved;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
}