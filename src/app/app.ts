import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Navigation } from './layout/navigation';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Navigation],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {}
