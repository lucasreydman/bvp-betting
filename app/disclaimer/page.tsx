import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Disclaimer | MLB BvP',
  description: 'Terms of use and disclaimer for MLB BvP.',
}

export default function DisclaimerPage() {
  return (
    <main className="max-w-3xl mx-auto px-4 py-10 text-gray-300 text-sm leading-7">
      <Link href="/" className="text-sky-400 hover:text-sky-300 transition-colors text-xs">
        &larr; Back to MLB BvP
      </Link>

      <h1 className="text-2xl font-bold text-white mt-6 mb-8">Disclaimer &amp; Terms of Use</h1>

      <div className="space-y-6">
        <section>
          <h2 className="text-base font-semibold text-white mb-2">For Informational Purposes Only</h2>
          <p>
            MLB BvP provides historical career batter vs pitcher statistics sourced from the official MLB Stats API.
            All content is provided strictly for informational and entertainment purposes. Nothing on this site
            constitutes financial advice, gambling advice, or a recommendation to place any wager.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-white mb-2">No Guarantee of Accuracy or Outcome</h2>
          <p>
            Past performance does not guarantee future results. Historical statistics reflect career data up to the
            moment they are fetched and may not account for current player form, injuries, weather conditions,
            lineup changes, or other factors that affect game outcomes. Data is fetched from a third-party API
            and may occasionally contain errors or delays.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-white mb-2">Responsible Gambling</h2>
          <p>
            Sports betting involves financial risk. Never bet more than you can afford to lose. If you or someone
            you know has a gambling problem, free confidential help is available:
          </p>
          <ul className="mt-3 space-y-1 text-gray-400">
            <li>
              <span className="text-white font-medium">USA:</span>{' '}
              National Problem Gambling Helpline: 1-800-522-4700 &middot;{' '}
              <span className="text-sky-400">ncpgambling.org</span>
            </li>
            <li>
              <span className="text-white font-medium">Canada:</span>{' '}
              Connex Ontario: 1-866-531-2600 &middot;{' '}
              <span className="text-sky-400">connexontario.ca</span>
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-semibold text-white mb-2">Intellectual Property</h2>
          <p>
            MLB team names, logos, and statistical data are the property of their respective owners. MLB BvP is
            an independent tool and is not affiliated with, endorsed by, or sponsored by Major League Baseball
            or any of its teams.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-white mb-2">Age Restriction</h2>
          <p>
            Sports betting is restricted to adults of legal gambling age in their jurisdiction. Do not use this
            tool if you are under the legal gambling age where you reside.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-white mb-2">Changes to This Disclaimer</h2>
          <p>
            This disclaimer may be updated at any time. Continued use of the site constitutes acceptance of
            any changes.
          </p>
        </section>
      </div>

      <p className="mt-10 text-gray-600 text-xs">
        &copy; {new Date().getFullYear()} Lucas Reydman. All rights reserved.
      </p>
    </main>
  )
}
