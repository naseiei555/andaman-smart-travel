import { Component } from '@angular/core';
import { IonContent } from '@ionic/angular';
import { PlaceDetailPage } from './place-detail.page';

@Component({
  selector: 'app-place-detail-route-page',
  standalone: true,
  imports: [IonContent, PlaceDetailPage],
  template: '<ion-content [fullscreen]="true"><app-place-detail-content /></ion-content>',
})
export class PlaceDetailRoutePage {}
