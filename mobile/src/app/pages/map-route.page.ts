import { Component } from '@angular/core';
import { IonContent } from '@ionic/angular';
import { InteractiveMapPage } from './interactive-map.page';

@Component({
  selector: 'app-map-route-page',
  standalone: true,
  imports: [IonContent, InteractiveMapPage],
  template: '<ion-content [fullscreen]="true"><app-interactive-map /></ion-content>',
})
export class MapRoutePage {}
