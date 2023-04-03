import { Component, OnInit } from '@angular/core';
import { GoogleService } from './google.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent implements OnInit {
  public files: File[] = [];

  constructor(private service: GoogleService) {}
  
  ngOnInit(): void {
    this.service.dataFromPicker.subscribe((res) => {
      this.files.push(...res);
    });
  }

  login() {
    this.service.createPicker();
  }

  logout() {
    this.service.logout();
  }

  checkLogin() {
    if (localStorage.getItem('token')) return true;
    else return false;
  }

  download(file: File) {
    const link = document.createElement('a');
    link.setAttribute('href', URL.createObjectURL(file));
    link.setAttribute('download', file.name);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  delete(i: number) {
    this.files.splice(i, 1);
  }
}
