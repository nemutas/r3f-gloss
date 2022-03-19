import { useRef, VFC } from 'react';
import * as THREE from 'three';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass';
import { extend, useFrame } from '@react-three/fiber';
import { GUIController } from '../../../modules/gui';

extend({ ShaderPass })

const datas = {
	enabled: true,
	scale: 0.05
}

export const ConstantNoisePass: VFC = () => {
	const passRef = useRef<ShaderPass>(null)

	const gui = GUIController.instance.setFolder('ConstantNoise').open(false)
	gui.addCheckBox(datas, 'enabled')
	gui.addNumericSlider(datas, 'scale', 0, 1, 0.01)

	const shader: THREE.Shader = {
		uniforms: {
			tDiffuse: { value: null },
			u_scale: { value: datas.scale }
		},
		vertexShader: vertexShader,
		fragmentShader: fragmentShader
	}

	const update = () => {
		const pass = passRef.current!
		pass.enabled = datas.enabled

		if (datas.enabled) {
			pass.uniforms.u_scale.value = datas.scale
		}
	}

	useFrame(() => {
		update()
	})

	return <shaderPass ref={passRef} attachArray="passes" args={[shader]} />
}

const vertexShader = `
varying vec2 vUv;

void main() {
  vUv = uv;

  gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}
`

const fragmentShader = `
uniform sampler2D tDiffuse;
uniform float u_scale;
varying vec2 vUv;

float random(vec2 p) {
  vec2 k1 = vec2(
      23.14069263277926, // e^pi (Gelfond's constant)
      2.665144142690225 // 2^sqrt(2) (Gelfond–Schneider constant)
  );
  return fract(
      cos(dot(p, k1)) * 12345.6789
  );
}

void main() {
  vec4 color = texture2D( tDiffuse, vUv );

  vec2 uvrandom = vUv;
  uvrandom.y *= random(vec2(uvrandom.y, 0.4));
  color.rgb += random(uvrandom) * u_scale;

  gl_FragColor = color;
}
`
