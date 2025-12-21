// Animation configuration
const ANIMATION_CONFIG = {
	duration: '3s', // Animation duration
	translateDistance: '3px', // Distance each piece moves
	timingFunction: 'ease-in-out', // Animation timing function
	staggerDelay: 0.75, // Delay between each piece (in seconds), clockwise starting from top-left
	scaleAmount: 1.2, // Scale of pieces when moved outward (1 = normal size, 0.9 = 90% size)
};

export function AnimatedLogo() {
	const { duration, translateDistance, timingFunction, staggerDelay, scaleAmount } = ANIMATION_CONFIG;

	// Calculate delays for each piece (clockwise: top-left → top-right → bottom-right → bottom-left)
	const delays = {
		topLeft: `${0 * staggerDelay}s`,
		topRight: `${1 * staggerDelay}s`,
		bottomRight: `${2 * staggerDelay}s`,
		bottomLeft: `${3 * staggerDelay}s`,
	};

	return (
		<>
			<style>
				{`
					@keyframes float-bottom-left {
						0%, 100% {
							transform: translate(0, 0) scale(1);
						}
						50% {
							transform: translate(-${translateDistance}, ${translateDistance}) scale(${scaleAmount});
						}
					}
					
					@keyframes float-top-left {
						0%, 100% {
							transform: translate(0, 0) scale(1);
						}
						50% {
							transform: translate(-${translateDistance}, -${translateDistance}) scale(${scaleAmount});
						}
					}
					
					@keyframes float-top-right {
						0%, 100% {
							transform: translate(0, 0) scale(1);
						}
						50% {
							transform: translate(${translateDistance}, -${translateDistance}) scale(${scaleAmount});
						}
					}
					
					@keyframes float-bottom-right {
						0%, 100% {
							transform: translate(0, 0) scale(1);
						}
						50% {
							transform: translate(${translateDistance}, ${translateDistance}) scale(${scaleAmount});
						}
					}
					
			.slack-piece-bottom-left {
				transform-box: fill-box;
				transform-origin: center;
				animation: float-bottom-left ${duration} ${timingFunction} ${delays.bottomLeft} infinite;
				animation-play-state: paused;
			}
			
			.slack-piece-top-left {
				transform-box: fill-box;
				transform-origin: center;
				animation: float-top-left ${duration} ${timingFunction} ${delays.topLeft} infinite;
				animation-play-state: paused;
			}
			
			.slack-piece-top-right {
				transform-box: fill-box;
				transform-origin: center;
				animation: float-top-right ${duration} ${timingFunction} ${delays.topRight} infinite;
				animation-play-state: paused;
			}
			
			.slack-piece-bottom-right {
				transform-box: fill-box;
				transform-origin: center;
				animation: float-bottom-right ${duration} ${timingFunction} ${delays.bottomRight} infinite;
				animation-play-state: paused;
			}
			
			svg:hover .slack-piece-bottom-left,
			svg:hover .slack-piece-top-left,
			svg:hover .slack-piece-top-right,
			svg:hover .slack-piece-bottom-right {
				animation-play-state: running;
			}
				`}
			</style>
			<svg className="size-[24px]" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
				<rect className="size-full" />
				<path
					className="slack-piece-bottom-left"
					d="M36.4 56.2C36.4 63.5 30.5 69.4 23.2 69.4C15.9 69.4 10 63.5 10 56.2C10 48.9 15.9 43 23.2 43H36.4V56.2Z"
					fill="#E01E5A"
				/>
				<path
					className="slack-piece-top-left"
					d="M23.2 36.4C15.9 36.4 10 30.5 10 23.2C10 15.9 15.9 10 23.2 10C30.5 10 36.4 15.9 36.4 23.2V36.4H23.2Z"
					fill="#36C5F0"
				/>
				<path
					className="slack-piece-top-right"
					d="M43 23.2C43 15.9 48.9 10 56.2 10C63.5 10 69.4 15.9 69.4 23.2C69.4 30.5 63.5 36.4 56.2 36.4H43V23.2Z"
					fill="#2EB67D"
				/>
				<path
					className="slack-piece-bottom-right"
					d="M56.2 43C63.5 43 69.4 48.9 69.4 56.2C69.4 63.5 63.5 69.4 56.2 69.4C48.9 69.4 43 63.5 43 56.2V43H56.2Z"
					fill="#ECB22E"
				/>
			</svg>
		</>
	);
}
