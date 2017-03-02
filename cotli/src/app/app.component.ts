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
        <td><br>{{hero.name}}<br></td>
        <td *ngFor="let loot of hero.lootSlot">{{loot?.name}}<br>
          <!--{{loot?.golden}}:{{loot?.rarity}}<br>-->
          Primary Effect: <span title="{{(loot.effects[0]||{}).effect_string}}">{{generateEffectString(loot.effects, 0)}}</span><br>
          Legendary Effect: <span title="{{(loot.effects[1]||{}).effect_string}}">{{generateEffectString(loot.effects, 1)}}</span><br>
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
  ability_defines: any[] = [];
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
          for (var a of cotliDefines.ability_defines) {
            this.ability_defines[a.id] = a;
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

  replaceDesc(desc: string, param: any): string {
    //console.log('replaceDesc(' + desc + ')');
    //console.log(param);
    var cnt=0;
    var nextVarStart = desc.indexOf('$');

    while (nextVarStart >= 0 && cnt < 100) {
      var pName: string;
      var val: string;
      var nextVarEnd = -1;
      if (desc[nextVarStart+1] == '(') {
        nextVarEnd = desc.indexOf(')', nextVarStart);
        pName = desc.substring(nextVarStart, nextVarEnd+1);
        //console.log('--- Need to call function #' + pName + '#');
        val = this.evaluate(pName, param);
      } else {
        pName = desc.substr(nextVarStart).match(/^\$[a-z]+/)[0];
        //console.log('--- Need to lookup #' + pName + '#');
        val = this.lookup(pName, param);
      }
      //console.log('REPLACING #' + pName + '# with #' + val + '#');
      desc = desc.replace(pName, val);
      cnt++;
      nextVarStart = desc.indexOf('$');
    }

    if (cnt >= 100) {
      console.log('Went over 100' + 0/0);
    } 

    return desc;
  }

  lookup(pName: string, param: any): string {
    var result = param[pName];

    if (result == undefined) {
      if (pName == '$target') {
        var targets = param['$targets'];
        if (targets != undefined) {
          if (targets[0].type == 'by_tags') {
            result = "";
            for (var i=0; i<targets[0].tags.length; i++) {
              var tag = this.describeTag(targets[0].tags[i]);
              if (i > 0) {
                result += ' and';
              }
              result += tag;
            }
            result = result + ' Crusaders';
          } else {
            result = 'UNKNOWN TARGET TYPE #' + targets[0].type + '#';
          }
        } else {
          result = 'CRUSADER';
        }
      } else {
        result = 'UNKNOWN PARAMETER #' + pName.replace(/\$/, '@') + '#';
      }
    }

    return result;
  }

  evaluate(p: string, param: any): string {
    p = p.substring(2, p.length-1);
    //console.log('real function: ' + p);
    var pArr = p.split(' ');
    var f = pArr[0];
    var result = p;
    switch(f) {
      case 'amount':
        if (param['$amount']) {
          result = param['$amount'];
          break;
        }
      case 'level_amount':
        if (param['$growth'] == 'exp') {
          result = '(' + param['$factor'] + '^LEVEL * ' + param['$base_amount'] + ')';
        } else {
          result = 'GROWTH:' + param['$growth'] + ';FACTOR:' + param['$factor'] + ';BASE_AMOUNT:' + param['$base_amount'];
        }
        break;
      case 'ability_name':
        var aDef = this.ability_defines[param['$' + pArr[1]]];
        result = aDef.name;
        break;
      case 'formation_ability_owner_name':
        var faDef = this.formation_ability_defines[param['$' + pArr[1]]];
        result = this.hero_defines[faDef.hero_id-1].name;
        break;
      case 'formation_ability_name':
        result = this.formation_ability_defines[param['$' + pArr[1]]].name;
        break;
      case 'formation_ability_effect':
        faDef = this.formation_ability_defines[param['$' + pArr[1]]];
        for (var p in faDef.effect[0]) {
          param['$' + p] = faDef.effect[0][p];
        }
        result = this.generateEffectString(faDef.effect, 0, param).replace(/#####.*/, '');
        break;
      case 'describe_tags':
        result = this.describeTag(param['$' + pArr[1]]);
        break;
      default:
        result = 'UNHANDLED EVALUATE: [' + f + ']';
    }
    return result;
  }

  describeTag(tag: string): string {
    return tag[0].toUpperCase() + tag.substring(1);
  }

  handleParamNames(parameters: any, names: string) {
    if (names.length == 0) {
      parameters['$amount'] = parameters.arg0;
    } else {
      var nArr = names.split(',');
      for (var i=0; i<nArr.length; i++) {
        var nameType = nArr[i];
        var typeArr = nameType.split(' ');
        var val: string;
        if (typeArr.length > 1) {
          var type = typeArr[0];
          nameType = typeArr[1];
          switch (type) {
            case 'int':
            case 'str':
              // nothing special here
              val = parameters['arg' + i];
              break;
            default:
              val = 'UNHANDLED TYPE: [' + type + ']';
          }
        } else {
          val = parameters['arg' + i];
        }
        parameters['$' + nameType] = val;
      }
    }
  }

  generateEffectString(arr: any, ind: number, parameters: any) {
    var lootEffectDef = arr[ind]||{};
    var es = lootEffectDef.effect_string||'';
    var parts = es.split(',');
    var effect = parts[0];
    if (effect) {
      var effectDef = this.effect_defines[effect];
      if (effectDef) {
        //console.log('effectString: ' + es);
        //console.log(effectDef);
        if (parameters === undefined) {
          parameters = {};
        }
        for (var p in lootEffectDef) {
          parameters['$' + p] = lootEffectDef[p];
        }
        for (var i=1; i<parts.length; i++) {
          parameters['arg'+(i-1)] = parts[i];
        }
        this.handleParamNames(parameters, effectDef.param_names);

        var desc = effectDef.descriptions.desc || effectDef.descriptions.all;

        desc = this.replaceDesc(desc, parameters);

        es = desc; // + '#####' + '(' + effect + ') ' + ' ' + JSON.stringify(parameters);
      } else {
        es = 'Unknown Effect: ' + es;
      }
    } else {
        es = 'UNDEFINED';
    }
    return es;
  }
}
