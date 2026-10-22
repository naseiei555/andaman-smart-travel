import { Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { IonContent, IonHeader, IonTitle, IonToolbar } from '@ionic/angular';

@Component({
  selector: 'app-placeholder',
  standalone: true,
  imports: [IonHeader, IonToolbar, IonTitle, IonContent],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-title>{{ title }}</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content class="ion-padding">
      <h2>{{ title }}</h2>
      <p>หน้านี้เป็นตัวอย่างชั่วคราว จะสร้างจริงในเฟสถัดไป</p>
    </ion-content>
  `,
})
export class PlaceholderPage {
  protected readonly title: string = inject(ActivatedRoute).snapshot.data['title'] ?? '';
}