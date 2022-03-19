import React, { VFC } from 'react';
import * as THREE from 'three';
import { Plane, useMatcapTexture } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { color, fresnel, matcap, rotate, twist } from '../../glsl/common';
import { combinations, sdf } from '../../glsl/raymarching';

export const ScreenPlane: VFC = () => {
	const [matcap] = useMatcapTexture('AB2C2C_EBB4B3_561212_DE8484', 512)

	const shader: THREE.Shader = {
		uniforms: {
			u_time: { value: 0 },
			u_aspect: { value: 0 },
			u_matcap: { value: matcap }
		},
		vertexShader: vertexShader,
		fragmentShader: fragmentShader
	}

	useFrame(({ size }) => {
		shader.uniforms.u_time.value += 0.005
		shader.uniforms.u_aspect.value = size.width / size.height
	})

	return (
		<Plane args={[2, 2]}>
			<shaderMaterial args={[shader]} />
		</Plane>
	)
}

const vertexShader = `
varying vec2 v_uv;

void main() {
  v_uv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}
`

const fragmentShader = `
uniform float u_time;
uniform float u_aspect;
uniform sampler2D u_matcap;
varying vec2 v_uv;

const float PI = 3.14159265358979;

${rotate}
${twist}
${color}
${matcap}
${fresnel}
${sdf}
${combinations}

float sdf(vec3 p) {
  vec3 rp = rotate(p, vec3(0.0, 1.0, 0.0), -u_time * 0.5);
  vec3 tp = twistY(rp, PI * 0.5);
  
  float sphere = sdSphere(p, 1.0);
  
  float distortion = 10.0;
  float g = dot(sin(p), cos(tp * distortion)) / distortion;  
  
  float dist = smoothstep(0.0, 1.0, length(p));
  float shape = opSmoothSubtraction(g - 0.05 * pow(dist, 1.5), sphere, 0.03);
  float shape2 = opSmoothSubtraction(-g - 0.13 * pow(dist, 1.0), sphere - 0.2, 0.03);
  shape = opSmoothUnion(shape, shape2, 0.05);
  
  return shape;
}

vec3 calcNormal(in vec3 p) {
  const float h = 0.0001;
  const vec2 k = vec2(1, -1) * h;
  return normalize( k.xyy * sdf( p + k.xyy ) + 
                    k.yyx * sdf( p + k.yyx ) + 
                    k.yxy * sdf( p + k.yxy ) + 
                    k.xxx * sdf( p + k.xxx ) );
}

void main() {
  vec2 centeredUV = (v_uv - 0.5) * vec2(u_aspect, 1.0);
  vec3 ray = normalize(vec3(centeredUV, -1.0));

  vec3 camPos = vec3(0.0, 0.0, 2.3);
  
  vec3 rayPos = camPos;
  float totalDist = 0.0;
  float tMax = 5.0;

  for(int i = 0; i < 256; i++) {
    float dist = sdf(rayPos);

    if (dist < 0.0001 || tMax < totalDist) break;

    totalDist += dist;
    rayPos = camPos + totalDist * ray;
  }

  vec3 color = vec3(0.98, 0.65, 0.89);
  if(totalDist < tMax) {
    vec3 normal = calcNormal(rayPos);
    
    vec2 matcapUV = matcap(ray, normal);
    color = texture2D(u_matcap, matcapUV).rgb;

    color = rgb2hsv(color);
    color.r = mix(1.0, 0.5, length(rayPos));
    color = hsv2rgb(color);
    
    float _fresnel = fresnel(ray, normal);
    color += _fresnel * 0.8;
  }

  gl_FragColor = vec4(color, 1.0);
}
`
