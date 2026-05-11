'use strict';

export const params = {
  attraction: 0.40,
  radius: 60,
  showRadius: false,
  foodRate: 1.0,
};

export function bindControls(onReset) {
  const attrSlider = document.getElementById('attraction');
  const radSlider  = document.getElementById('radius');
  const foodSlider = document.getElementById('foodrate');
  const vAttr      = document.getElementById('v-attr');
  const vRad       = document.getElementById('v-rad');
  const vFood      = document.getElementById('v-food');
  const togRad     = document.getElementById('toggle-radius');

  attrSlider.oninput = e => {
    params.attraction = e.target.value / 100;
    vAttr.textContent = params.attraction.toFixed(2);
  };

  radSlider.oninput = e => {
    params.radius = +e.target.value;
    vRad.textContent = params.radius + ' px';
  };

  foodSlider.oninput = e => {
    params.foodRate = e.target.value / 100;
    vFood.textContent = params.foodRate.toFixed(1) + '×';
  };

  togRad.onclick = () => {
    params.showRadius = !params.showRadius;
    togRad.querySelector('.switch').classList.toggle('on', params.showRadius);
  };

  document.getElementById('reset').onclick = onReset;
}
