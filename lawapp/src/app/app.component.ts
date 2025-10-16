import { Component } from '@angular/core';
import { Router, NavigationStart, NavigationEnd } from '@angular/router';
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'lawapp';
  constructor(private router: Router) {
    this.router.events.subscribe(event => {
      if (event instanceof NavigationStart) {
        console.log('NAVIGATING TO:', event.url);
      }
      if (event instanceof NavigationEnd) {
        console.log('CURRENT ROUTE:', this.router.url);
        console.log('ACTIVATED COMPONENT:', this.router.routerState.snapshot.root);
      }
    });
  }
}
