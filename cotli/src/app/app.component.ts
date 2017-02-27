import { Component, OnInit } from '@angular/core';
import { Http, Response, Headers, RequestOptions } from '@angular/http';
import {Observable} from 'rxjs/Rx';


@Component({
  selector: 'my-app',
  template: `
  <h1>Crusader Gear</h1>
  <table border="1">
  <tr *ngFor="let seat of seats">
    <td>{{seat.seatId}}</td>
    <td>
    <table border="1">
      <tr *ngFor="let hero of seat.heroes">
        <td>{{hero.name}}</td>
        <td *ngFor="let loot of hero.lootSlot">{{loot?.name}}<br>
          {{loot?.golden}}:{{loot?.rarity}}<br>
          Primary Effect: <span title="{{(loot.effects[0]||{}).effect_string}}">{{generateEffectString(loot.effects, 0)}}</span><br>
          Legendary Effect: <span title="{{(loot.effects[1]||{}).effect_string}}">{{generateEffectString(loot.effects, 1)}}</span>
        </td>
      </tr>
    </table>
    </td>
  </tr>
  </table>
  `,
})
export class AppComponent implements OnInit { 
  name = 'Angular';
  hero_defines: any[];
  loot_defines: any[];
  effect_defines: any[] = [];
  formation_ability_defines: any[] = [];
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
          for (var f of cotliDefines.formation_ability_defines) {
            this.formation_ability_defines[f.id] = f;
          }
          for (var e of cotliDefines.effect_defines) {
            this.effect_defines[e.effect_key] = e;
          }
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
      var currentLoot = hero.lootSlot[loot.slot_id-1];
      if (currentLoot === undefined || 
          currentLoot.rarity < loot.rarity || 
          (currentLoot.rarity == loot.rarity && currentLoot.golden < loot.golden && currentLoot.effects.length <= loot.effects.length)) {
        hero.lootSlot[loot.slot_id-1] = loot;
      }
    }
  }

  assignSeats() {
    for (var hero of this.hero_defines) {
      if (this.seats[hero.seat_id-1] === undefined) {
        this.seats[hero.seat_id-1] = {seatId: hero.seat_id, heroes: []};
      }
      this.seats[hero.seat_id-1].heroes.push(hero);
    }
  }

  generateEffectString(arr: any, ind: number) {
    var lootEffectDef = arr[ind]||{};
    var es = lootEffectDef.effect_string||'';
    //console.log('effectString: ' + es);
    var parts = es.split(',');
    var effect = parts[0];
    //console.log('effect = ' + effect);
    if (effect) {
      var effectDef = this.effect_defines[effect];
      if (effectDef) {
        if (effectDef.owner == '') {
          if (effect === 'unlock_formation_ability') {
            var formationAbilityDef = this.formation_ability_defines[parts[1]];
            var desc = formationAbilityDef.effect_description;
            if (desc == 'desc') {
              var mergedLootAbility = JSON.parse(JSON.stringify(lootEffectDef));
              mergedLootAbility.effect_string = formationAbilityDef.effect[0].effect_string;
              es = '@' + this.generateEffectString([mergedLootAbility], 0);
            } else {
              desc = desc.replace('$amount', '$(level_amount)');
              es = this.replaceDescription({desc: desc}, parts, formationAbilityDef, lootEffectDef, undefined)
            }
          } else {
            es = 'Unhandled non-owner Effect: ' + es;
          }
        } else if (effectDef.owner == 'global') {
          var amtValue = parts[1];
          es = this.replaceDescription(effectDef.descriptions, parts, effectDef, lootEffectDef, undefined)
        } else if (effectDef.owner == 'formation_ability') {
          var formationAbilityDef = this.formation_ability_defines[parts[2]];
          es = this.replaceDescription(effectDef.descriptions, parts, effectDef, lootEffectDef, formationAbilityDef)
        } else {
          es = 'Unhandled Effect: ' + es;
        }
      } else {
        es = 'Unknown Effect: ' + es;
      }
    } else {
        es = 'UNDEFINED';
    }
    return es;
  }

  replaceDescription(descriptions: any, parts: string[], effectDef: any, lootEffectDef: any, formationAbilityDef?: any) {
    var desc = descriptions.desc || descriptions.all || '';
    var result = desc.replace('$amount', parts[1]);
    var levelAmount = 'UnknownLevelAmount';
    if (lootEffectDef.growth == 'exp') {
      levelAmount = '(' + lootEffectDef.factor + '^LEVEL * ' + lootEffectDef.base_amount + ')';
    } else {
      levelAmount += 'GROWTH:' + lootEffectDef.growth + ';FACTOR:' + lootEffectDef.factor + ';BASE_AMOUNT:' + lootEffectDef.base_amount;
    }

    result = result.replace('$(level_amount)', levelAmount);

    result = result.replace('$target', 'CRUSADER');

    result = result.replace('$(describe_tags tag)', parts[2]);

    if (formationAbilityDef !== undefined) {
      result = result.replace('$(formation_ability_owner_name id)', this.hero_defines[formationAbilityDef.hero_id-1].name);
      result = result.replace('$(formation_ability_name id)', formationAbilityDef.name);
    }

    return result;
  }
}
