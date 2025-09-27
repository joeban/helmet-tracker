import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: "Virginia Tech STAR Methodology - HelmetScore",
  description: "Learn about Virginia Tech's STAR evaluation methodology for bicycle helmet safety testing, including test protocols, scoring systems, and research methodology.",
  keywords: "STAR methodology, helmet testing, Virginia Tech research, cycling safety standards, impact testing",
  openGraph: {
    title: "Virginia Tech STAR Methodology - HelmetScore",
    description: "Understanding the scientific methodology behind bicycle helmet safety ratings.",
    url: "https://helmetscore.com/methodology",
  },
};

export default function MethodologyPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-gradient-to-b from-slate-50 to-white border-b border-slate-200 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <Link href="/" className="text-blue-600 hover:text-blue-700 font-medium mb-4 inline-block">
            ← Back to HelmetScore Database
          </Link>
          <h1 className="text-4xl font-semibold text-slate-800 mb-3">STAR Methodology</h1>
          <p className="text-xl text-slate-600">Understanding Virginia Tech's bicycle helmet safety evaluation</p>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-8 mb-8">

          {/* Overview */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-slate-800 mb-4">What is STAR?</h2>
            <p className="text-lg text-slate-600 leading-relaxed mb-4">
              STAR (Summation of Tests for the Analysis of Risk) is Virginia Tech's proprietary methodology for evaluating
              bicycle helmet safety. Unlike basic safety certifications that only test pass/fail criteria, STAR provides
              nuanced safety scores that allow meaningful comparisons between helmet models.
            </p>
            <div className="bg-blue-50 p-6 rounded-lg">
              <h3 className="text-lg font-semibold text-slate-800 mb-2">Key Innovation</h3>
              <p className="text-slate-600">
                STAR methodology simulates real-world cycling accidents using impact data from actual crash scenarios,
                providing more relevant safety assessments than traditional laboratory testing alone.
              </p>
            </div>
          </section>

          {/* Testing Protocol */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-slate-800 mb-4">Testing Protocol</h2>

            <div className="grid md:grid-cols-2 gap-6 mb-6">
              <div className="bg-slate-50 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-slate-800 mb-3">Impact Locations</h3>
                <ul className="text-slate-600 space-y-2">
                  <li>• Front impact zone</li>
                  <li>• Front boss (forehead area)</li>
                  <li>• Side impact zone</li>
                  <li>• Rear impact zone</li>
                  <li>• Top impact zone</li>
                </ul>
              </div>
              <div className="bg-slate-50 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-slate-800 mb-3">Impact Velocities</h3>
                <ul className="text-slate-600 space-y-2">
                  <li>• 4.8 m/s (10.7 mph)</li>
                  <li>• 5.5 m/s (12.3 mph)</li>
                  <li>• 6.2 m/s (13.9 mph)</li>
                  <li>• Various angles and orientations</li>
                  <li>• Multiple impact scenarios</li>
                </ul>
              </div>
            </div>

            <div className="bg-gradient-to-r from-slate-50 to-blue-50 p-6 rounded-lg">
              <h3 className="text-lg font-semibold text-slate-800 mb-3">Test Conditions</h3>
              <p className="text-slate-600 mb-4">
                Each helmet model undergoes standardized impact tests using a custom-built testing apparatus.
                The system measures linear and rotational acceleration during impacts, simulating forces that
                can cause both focal and diffuse brain injuries.
              </p>
              <div className="grid md:grid-cols-3 gap-4 text-sm">
                <div>
                  <strong className="text-slate-800">Temperature:</strong>
                  <br />Controlled laboratory conditions
                </div>
                <div>
                  <strong className="text-slate-800">Samples:</strong>
                  <br />Multiple helmets per model
                </div>
                <div>
                  <strong className="text-slate-800">Measurements:</strong>
                  <br />High-speed data acquisition
                </div>
              </div>
            </div>
          </section>

          {/* Scoring System */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-slate-800 mb-4">STAR Scoring System</h2>

            <div className="bg-yellow-50 p-6 rounded-lg mb-6">
              <h3 className="text-lg font-semibold text-slate-800 mb-3">Lower Scores = Better Protection</h3>
              <p className="text-slate-600">
                STAR scores represent relative risk levels. A helmet with a score of 8.0 provides significantly
                better protection than one with a score of 15.0. The scale is logarithmic, meaning small
                differences in scores represent meaningful differences in protection levels.
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-4 p-4 bg-green-50 rounded-lg">
                <div className="text-2xl">⭐⭐⭐⭐⭐</div>
                <div>
                  <div className="font-semibold text-slate-800">5 Stars (≤ 10.0)</div>
                  <div className="text-slate-600 text-sm">Excellent protection - Top-tier safety performance</div>
                </div>
              </div>
              <div className="flex items-center gap-4 p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl">⭐⭐⭐⭐</div>
                <div>
                  <div className="font-semibold text-slate-800">4 Stars (10.1-15.0)</div>
                  <div className="text-slate-600 text-sm">Good protection - Above-average safety performance</div>
                </div>
              </div>
              <div className="flex items-center gap-4 p-4 bg-yellow-50 rounded-lg">
                <div className="text-2xl">⭐⭐⭐</div>
                <div>
                  <div className="font-semibold text-slate-800">3 Stars (15.1-20.0)</div>
                  <div className="text-slate-600 text-sm">Fair protection - Meets safety standards</div>
                </div>
              </div>
              <div className="flex items-center gap-4 p-4 bg-orange-50 rounded-lg">
                <div className="text-2xl">⭐⭐</div>
                <div>
                  <div className="font-semibold text-slate-800">2 Stars (20.1-25.0)</div>
                  <div className="text-slate-600 text-sm">Marginal protection - Consider upgrading</div>
                </div>
              </div>
              <div className="flex items-center gap-4 p-4 bg-red-50 rounded-lg">
                <div className="text-2xl">⭐</div>
                <div>
                  <div className="font-semibold text-slate-800">1 Star (&gt; 25.0)</div>
                  <div className="text-slate-600 text-sm">Not recommended - Poor safety performance</div>
                </div>
              </div>
            </div>
          </section>

          {/* Research Foundation */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-slate-800 mb-4">Research Foundation</h2>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold text-slate-800 mb-3">Crash Data Analysis</h3>
                <p className="text-slate-600 text-sm mb-4">
                  Virginia Tech researchers analyzed thousands of real cycling accidents to understand impact
                  locations, velocities, and injury patterns. This data directly informs the STAR testing protocol.
                </p>
                <ul className="text-slate-600 text-sm space-y-1">
                  <li>• Emergency department records</li>
                  <li>• Police accident reports</li>
                  <li>• Insurance claim data</li>
                  <li>• Helmet damage analysis</li>
                </ul>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-800 mb-3">Biomechanical Modeling</h3>
                <p className="text-slate-600 text-sm mb-4">
                  Advanced computer models simulate how impact forces translate to brain tissue deformation,
                  providing insight into injury mechanisms and helmet protective capabilities.
                </p>
                <ul className="text-slate-600 text-sm space-y-1">
                  <li>• Finite element analysis</li>
                  <li>• Brain injury thresholds</li>
                  <li>• Material property testing</li>
                  <li>• Impact dynamics modeling</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Limitations */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-slate-800 mb-4">Understanding Limitations</h2>
            <div className="bg-slate-50 p-6 rounded-lg">
              <p className="text-slate-600 leading-relaxed mb-4">
                While STAR methodology represents the most comprehensive bicycle helmet evaluation available,
                it's important to understand its scope and limitations:
              </p>
              <ul className="text-slate-600 space-y-2">
                <li>• <strong>Laboratory conditions:</strong> Testing occurs in controlled environments that may not capture all real-world variables</li>
                <li>• <strong>Impact scenarios:</strong> Tests simulate common accident types but cannot cover every possible crash scenario</li>
                <li>• <strong>Individual variation:</strong> Helmet fit, wear patterns, and user behavior affect real-world protection</li>
                <li>• <strong>Technology evolution:</strong> New helmet technologies may not be fully captured by existing test protocols</li>
              </ul>
            </div>
          </section>

          {/* Data Accuracy */}
          <section>
            <h2 className="text-2xl font-semibold text-slate-800 mb-4">Data Accuracy & Updates</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-green-50 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-slate-800 mb-3">HelmetScore Commitment</h3>
                <p className="text-slate-600 text-sm">
                  All safety scores in our database come directly from Virginia Tech's official publications.
                  We do not modify, adjust, or interpret the original research data.
                </p>
              </div>
              <div className="bg-blue-50 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-slate-800 mb-3">Regular Updates</h3>
                <p className="text-slate-600 text-sm">
                  As Virginia Tech publishes new helmet evaluations, we update our database to include
                  the latest safety ratings and newly tested models.
                </p>
              </div>
            </div>
            <div className="mt-6 text-center">
              <Link
                href="/"
                className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors inline-block"
              >
                Explore the Safety Database
              </Link>
            </div>
          </section>

        </div>
      </main>
    </div>
  );
}