import { Suspense, VFC } from 'react';
import * as THREE from 'three';
import { Stats } from '@react-three/drei';
import { Canvas } from '@react-three/fiber';
import { ConstantNoisePass } from './postprocessing/ConstantNoisePass';
import { Effects } from './postprocessing/Effects';
import { FocusPass } from './postprocessing/FocusPass';
import { FXAAPass } from './postprocessing/FXAAPass';
import { ScreenPlane } from './ScreenPlane';

export const TCanvas: VFC = () => {
	const OrthographicCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, -10, 10)

	return (
		<Canvas camera={OrthographicCamera} dpr={window.devicePixelRatio}>
			{/* objects */}
			<Suspense fallback={null}>
				<ScreenPlane />
			</Suspense>
			{/* effects */}
			<Effects sRGBCorrection={false}>
				<FXAAPass />
				<FocusPass />
				<ConstantNoisePass />
			</Effects>
			{/* helper */}
			<Stats />
		</Canvas>
	)
}
