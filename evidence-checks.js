"use strict";
/* Vérifications déterministes de rendus JSON : aucune exécution de code, ni réseau.
   Elles contrôlent un résultat borné et explicable, pas une compétence professionnelle. */
const RC_EVIDENCE = (() => {
 const cases = {
  "lab-02":{
   title:"Filtrer des observations météo",task:"Rends un fichier JSON avec observations = [{time,temperature,rain}] pour trois heures 08:00 (4 °C, 0 mm), 09:00 (7 °C, 2 mm), 10:00 (11 °C, 1 mm). Ajoute rainy = [{time,temperature}] contenant seulement les deux heures avec rain > 0, dans l'ordre.",
   check:o=>[
    ["Trois observations d'entrée",Array.isArray(o.observations)&&o.observations.length===3],
    ["Données d'entrée exactes",JSON.stringify(o.observations)===JSON.stringify([{time:"08:00",temperature:4,rain:0},{time:"09:00",temperature:7,rain:2},{time:"10:00",temperature:11,rain:1}])],
    ["Deux résultats filtrés",Array.isArray(o.rainy)&&o.rainy.length===2],
    ["Filtre et mapping corrects",JSON.stringify(o.rainy)===JSON.stringify([{time:"09:00",temperature:7},{time:"10:00",temperature:11}])]
   ]},
  "lab-04":{
   title:"Décomposer les permissions POSIX",task:"Rends un JSON {mode, owner, group, others} pour chmod 640 ; owner/group/others sont des tableaux de droits parmi read, write, execute, dans cet ordre.",
   check:o=>[
    ["Mode 640",o.mode==="640"],
    ["Propriétaire : lecture et écriture",JSON.stringify(o.owner)===JSON.stringify(["read","write"])],
    ["Groupe : lecture seulement",JSON.stringify(o.group)===JSON.stringify(["read"])],
    ["Autres : aucun droit",Array.isArray(o.others)&&o.others.length===0]
   ]},
  "lab-05":{
   title:"Choisir la route la plus spécifique",task:"Rends un JSON {destination,selectedGateway,reason} pour une cible 10.0.0.42 avec routes 0.0.0.0/0 via 192.168.1.1 et 10.0.0.0/24 via 10.0.0.1. reason doit mentionner /24 et la spécificité du préfixe.",
   check:o=>[
    ["Destination attendue",o.destination==="10.0.0.42"],
    ["Passerelle du /24",o.selectedGateway==="10.0.0.1"],
    ["Justification du préfixe le plus spécifique",typeof o.reason==="string"&&/\/24/.test(o.reason)&&/sp[eé]cifi|longest|pr[eé]fix/i.test(o.reason)]
   ]},
  "lab-09":{
   title:"Tester une décision d'autorisation",task:"Dans un laboratoire FICTIF, le compte viewer demande delete sur un objet appartenant à other. Rends {principal,action,resourceOwner,authorized,serverSideCheck,remediation} : indique le refus attendu et la remédiation côté serveur.",
   check:o=>[
    ["Identité et action du scénario",o.principal==="viewer"&&o.action==="delete"&&o.resourceOwner==="other"],
    ["Suppression refusée",o.authorized===false],
    ["Contrôle serveur prévu",o.serverSideCheck===true],
    ["Remédiation argumentée",typeof o.remediation==="string"&&o.remediation.trim().length>=35&&/serveur|server|autori|permission|owner|propri[eé]t/i.test(o.remediation)]
   ]},
  "lab-12":{
   title:"Politique IAM minimale",task:"Rends une politique AWS IAM JSON : Version 2012-10-17, une seule instruction Allow pour s3:GetObject, uniquement arn:aws:s3:::rc-training/*, sans wildcard global ni autre action.",
   check:o=>{
    const st=Array.isArray(o.Statement)?o.Statement:[o.Statement],s=st[0]||{};
    const actions=typeof s.Action==="string"?[s.Action]:s.Action,resources=typeof s.Resource==="string"?[s.Resource]:s.Resource;
    return [
     ["Version IAM",o.Version==="2012-10-17"],
     ["Une seule instruction Allow",st.length===1&&s.Effect==="Allow"],
     ["Une seule action en lecture",Array.isArray(actions)&&actions.length===1&&actions[0]==="s3:GetObject"],
     ["Ressource limitée au lab",Array.isArray(resources)&&resources.length===1&&resources[0]==="arn:aws:s3:::rc-training/*"],
     ["Aucun NotAction/NotResource",!Object.prototype.hasOwnProperty.call(s,"NotAction")&&!Object.prototype.hasOwnProperty.call(s,"NotResource")&&!Object.prototype.hasOwnProperty.call(s,"Condition")]
    ];
   }}
 };
 function verify(id,text){
  if(!cases[id])return{ok:false,checks:[{label:"Lab sans correcteur automatique",ok:false}]};
  if(typeof text!=="string"||text.length>65536)return{ok:false,checks:[{label:"Fichier JSON supérieur à 64 Kio ou illisible",ok:false}]};
  let o;try{o=JSON.parse(text);}catch(e){return{ok:false,checks:[{label:"JSON syntaxiquement invalide",ok:false}]};}
  if(!o||typeof o!=="object"||Array.isArray(o))return{ok:false,checks:[{label:"Le document racine doit être un objet JSON",ok:false}]};
  const checks=cases[id].check(o).map(([label,ok])=>({label,ok:!!ok}));
  return {ok:checks.every(c=>c.ok),checks};
 }
 return Object.freeze({cases,verify});
})();
