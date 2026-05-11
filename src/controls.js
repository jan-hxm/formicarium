"use strict";

export const params = {
  attraction: 0.25,
  repulsion: 55,
  radius: 55,
  showRadius: false,
  foodRate: 0.5,
  maxSpeed: 100,
  colonySize: 6,
  damping: 0.95,
  wanderStrength: 0.3,
  evapRate: 0.15,
  pheroStrength: 0.85,
  showPheromones: false,
};

export function bindControls(onReset) {
  const attrSlider = document.getElementById("attraction");
  const repSlider = document.getElementById("repulsion");
  const radSlider = document.getElementById("radius");
  const foodSlider = document.getElementById("foodrate");
  const dampSlider = document.getElementById("damping");
  const speedSlider = document.getElementById("maxspeed");
  const colonySlider = document.getElementById("colonysize");
  const wanderSlider = document.getElementById("wanderstrength");
  const evapSlider = document.getElementById("evaprate");
  const pheroSlider = document.getElementById("pherostrength");

  const vAttr = document.getElementById("v-attr");
  const vRep = document.getElementById("v-rep");
  const vRad = document.getElementById("v-rad");
  const vFood = document.getElementById("v-food");
  const vDamp = document.getElementById("v-damp");
  const vSpeed = document.getElementById("v-speed");
  const vColony = document.getElementById("v-colony");
  const vWander = document.getElementById("v-wander");
  const vEvap = document.getElementById("v-evap");
  const vPhero = document.getElementById("v-phero");
  const togRad = document.getElementById("toggle-radius");
  const togPhero = document.getElementById("toggle-pheromones");

  attrSlider.oninput = (e) => {
    params.attraction = e.target.value / 100;
    vAttr.textContent = params.attraction.toFixed(2);
  };

  repSlider.oninput = (e) => {
    params.repulsion = +e.target.value;
    vRep.textContent = params.repulsion;
  };

  radSlider.oninput = (e) => {
    params.radius = +e.target.value;
    vRad.textContent = params.radius + " px";
  };

  foodSlider.oninput = (e) => {
    params.foodRate = e.target.value / 100;
    vFood.textContent = params.foodRate.toFixed(1) + "×";
  };

  dampSlider.oninput = (e) => {
    params.damping = e.target.value / 100;
    vDamp.textContent = params.damping.toFixed(2);
  };

  speedSlider.oninput = (e) => {
    params.maxSpeed = +e.target.value;
    vSpeed.textContent = params.maxSpeed;
  };

  colonySlider.oninput = (e) => {
    params.colonySize = +e.target.value;
    vColony.textContent = params.colonySize;
  };

  wanderSlider.oninput = (e) => {
    params.wanderStrength = e.target.value / 100;
    vWander.textContent = params.wanderStrength.toFixed(2);
  };

  togRad.onclick = () => {
    params.showRadius = !params.showRadius;
    togRad.querySelector(".switch").classList.toggle("on", params.showRadius);
  };

  evapSlider.oninput = (e) => {
    params.evapRate = e.target.value / 100;
    vEvap.textContent = params.evapRate.toFixed(2);
  };

  pheroSlider.oninput = (e) => {
    params.pheroStrength = e.target.value / 100;
    vPhero.textContent = params.pheroStrength.toFixed(2);
  };

  const pheroLegend = document.getElementById("phero-legend");

  togPhero.onclick = () => {
    params.showPheromones = !params.showPheromones;
    togPhero
      .querySelector(".switch")
      .classList.toggle("on", params.showPheromones);
    pheroLegend.style.display = params.showPheromones ? "contents" : "none";
  };

  document.getElementById("reset").onclick = onReset;
}
