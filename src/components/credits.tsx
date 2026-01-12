import { trackEvent } from '@/utils/analytics';
import { browser } from '#imports';

function Credits() {
	return (
		<a
			href="https://github.com/kirankunigiri/slacky"
			target="_blank"
			rel="noreferrer"
			className="group"
			onClick={() => trackEvent({ eventName: 'link_clicked', eventProperties: { type: 'author' } })}
		>
			<p className="relative inline-block flex-1 cursor-pointer text-right opacity-60
								after:absolute after:bottom-0 after:left-0 after:block after:h-[2px] after:w-full after:origin-left after:scale-x-0 after:bg-gray-300 after:transition-transform after:duration-200 after:content-[''] group-hover:after:scale-x-100 dark:after:bg-gray-600"
			>
				v{browser.runtime.getManifest().version} by Kiran Kunigiri
			</p>
		</a>
	);
}

export default Credits;
