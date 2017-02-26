import { Component, OnInit } from '@angular/core';
import { Http, Response, Headers, RequestOptions } from '@angular/http';
import {Observable} from 'rxjs/Rx';


@Component({
  selector: 'my-app',
  template: `
    <h1>Hello {{name}}</h1>
    <table>
    <tr *ngFor="let hero of hero_defines">
        <td>{{hero.name}}</td>
    </tr>
    </table>

  `,
})
export class AppComponent implements OnInit { 
    name = 'Angular';
    hero_defines: Object;
    loot_defines: Object;
    effect_defines: Object;

    constructor(private http: Http) {
    }

    ngOnInit() {
        console.log("onInit");
        var url = '../data/cotliDefines.json';
        this.http.get(url)
            .map((res:Response) => res.json())
            .catch((error:any) => Observable.throw(error.json().error || 'Server error'))
            .subscribe(
                cotliDefines => {
                    console.log("cotliDefines: ");
                    console.log(cotliDefines);
                    this.hero_defines = cotliDefines.hero_defines;
                    this.loot_defines = cotliDefines.loot_defines;
                    this.effect_defines = cotliDefines.effect_defines;
                },
                err => {
                    console.log("Error from subscribe: " + err):
                }
            );
        console.log("after http");
    }
}
