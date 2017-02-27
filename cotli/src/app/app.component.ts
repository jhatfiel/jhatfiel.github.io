import { Component, OnInit } from '@angular/core';
import { Http, Response, Headers, RequestOptions } from '@angular/http';
import {Observable} from 'rxjs/Rx';


@Component({
  selector: 'my-app',
  template: `
    <h1>Crusader Gear</h1>
    <table border="1">
    <tr *ngFor="let seat of seats"><td>
        <table border="1">
        <tr *ngFor="let hero of seat">
            <td>{{hero.name}}</td>
            <td *ngFor="let loot of hero.lootSlot">{{loot?.name}}<br>
            {{loot?.golden}}:{{loot?.rarity}}
            </td>
        </tr>
        </table>
    </td></tr>
    </table>
  `,
})
export class AppComponent implements OnInit { 
    name = 'Angular';
    hero_defines: any[];
    loot_defines: any[];
    effect_defines: any[];
    seats: any[] = [];

    constructor(private http: Http) {
    }

    ngOnInit() {
        var url = '../data/cotliDefines.json';
        this.http.get(url)
            .map((res:Response) => res.json())
            .catch((error:any) => Observable.throw(error.json().error || 'Server error'))
            .subscribe(
                cotliDefines => {
                    this.hero_defines = cotliDefines.hero_defines;
                    this.loot_defines = cotliDefines.loot_defines;
                    this.effect_defines = cotliDefines.effect_defines;
                    this.assignSeats();
                    this.assignLootSlots();
                },
                err => {
                    console.log("Error from subscribe: " + err);
                }
            );
    }

    assignLootSlots() {
        for (var loot of this.loot_defines) {
            var heroId = loot.hero_id;
            if (heroId == 0) continue;
            var hero = this.hero_defines[heroId-1];
            if (hero.lootSlot === undefined) {
                hero.lootSlot = [];
            }
            var currentLoot = hero.lootSlot[loot.slot_id];
            if (currentLoot === undefined || currentLoot.rarity < loot.rarity || currentLoot.golden < loot.golden) {
                hero.lootSlot[loot.slot_id] = loot;
            }
        }
    }

    assignSeats() {
        for (var hero of this.hero_defines) {
            if (this.seats[hero.seat_id-1] === undefined) {
                this.seats[hero.seat_id-1] = [];
            }
            this.seats[hero.seat_id-1].push(hero);
        }
    }
}
