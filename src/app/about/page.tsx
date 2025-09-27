import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: "About HelmetScore - The Definitive Helmet Safety Database",
  description: "Learn about HelmetScore's mission to provide comprehensive Virginia Tech helmet safety ratings, helping cyclists make informed decisions about protective gear.",
  keywords: "helmet safety, Virginia Tech STAR, cycling safety research, helmet testing methodology",
  openGraph: {
    title: "About HelmetScore - Helmet Safety Database",
    description: "The definitive resource for Virginia Tech helmet safety ratings and cycling protection research.",
    url: "https://helmetscore.com/about",
  },
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-gradient-to-b from-slate-50 to-white border-b border-slate-200 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <Link href="/" className="text-blue-600 hover:text-blue-700 font-medium mb-4 inline-block">
            ← Back to HelmetScore Database
          </Link>
          <h1 className="text-4xl font-semibold text-slate-800 mb-3">About HelmetScore</h1>
          <p className="text-xl text-slate-600">The definitive resource for bicycle helmet safety research</p>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-8 mb-8">

          {/* Mission Section */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-slate-800 mb-4">Our Mission</h2>
            <p className="text-lg text-slate-600 leading-relaxed mb-4">
              HelmetScore exists to make bicycle helmet safety data accessible, understandable, and actionable for every cyclist.
              By presenting Virginia Tech's comprehensive STAR evaluation data in an intuitive format, we help riders make
              informed decisions about the most critical piece of safety equipment they wear.
            </p>
            <p className="text-lg text-slate-600 leading-relaxed">
              Every helmet in our database has been rigorously tested using the same scientific methodology, providing
              objective safety comparisons across brands, price points, and riding styles.
            </p>
          </section>

          {/* Why Virginia Tech Section */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-slate-800 mb-4">Why Virginia Tech STAR Ratings?</h2>
            <div className="bg-slate-50 p-6 rounded-lg mb-6">
              <h3 className="text-lg font-semibold text-slate-800 mb-3">The Gold Standard in Helmet Testing</h3>
              <p className="text-slate-600 leading-relaxed">
                Virginia Tech's Helmet Lab is internationally recognized as the premier independent testing facility for bicycle helmets.
                Their STAR (Summation of Tests for the Analysis of Risk) methodology goes beyond basic safety certifications
                to provide nuanced safety scores based on real-world accident scenarios.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-blue-50 p-6 rounded-lg">
                <h4 className="font-semibold text-slate-800 mb-2">Comprehensive Testing</h4>
                <p className="text-slate-600 text-sm">
                  Each helmet undergoes multiple impact tests at various speeds and angles, simulating real cycling accidents.
                </p>
              </div>
              <div className="bg-blue-50 p-6 rounded-lg">
                <h4 className="font-semibold text-slate-800 mb-2">Independent Research</h4>
                <p className="text-slate-600 text-sm">
                  Virginia Tech receives no funding from helmet manufacturers, ensuring completely unbiased results.
                </p>
              </div>
              <div className="bg-blue-50 p-6 rounded-lg">
                <h4 className="font-semibold text-slate-800 mb-2">Scientific Rigor</h4>
                <p className="text-slate-600 text-sm">
                  Published methodology and peer-reviewed research provide transparency and credibility.
                </p>
              </div>
              <div className="bg-blue-50 p-6 rounded-lg">
                <h4 className="font-semibold text-slate-800 mb-2">Continuous Updates</h4>
                <p className="text-slate-600 text-sm">
                  Regular testing of new helmet models keeps the database current with latest safety innovations.
                </p>
              </div>
            </div>
          </section>

          {/* Our Database Section */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-slate-800 mb-4">Our Database</h2>
            <div className="grid md:grid-cols-3 gap-6 mb-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600 mb-2">281</div>
                <div className="text-slate-600">Tested Helmets</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600 mb-2">45+</div>
                <div className="text-slate-600">Brands Covered</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600 mb-2">100%</div>
                <div className="text-slate-600">Official VT Data</div>
              </div>
            </div>
            <p className="text-slate-600 leading-relaxed">
              Our comprehensive database includes every bicycle helmet tested by Virginia Tech's lab, from budget-friendly
              options to premium models. Each entry includes the official STAR safety score, pricing information, and
              direct links to purchase from trusted retailers.
            </p>
          </section>

          {/* Understanding Safety Scores */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-slate-800 mb-4">Understanding Safety Scores</h2>
            <div className="bg-gradient-to-r from-green-50 to-red-50 p-6 rounded-lg mb-4">
              <div className="flex justify-between items-center mb-4">
                <span className="text-sm font-medium text-green-700">Better Protection</span>
                <span className="text-sm font-medium text-red-700">Lower Protection</span>
              </div>
              <div className="h-4 bg-gradient-to-r from-green-400 to-red-400 rounded-full"></div>
              <div className="flex justify-between text-xs text-slate-600 mt-2">
                <span>0-10</span>
                <span>10-15</span>
                <span>15-20</span>
                <span>20-25</span>
                <span>25+</span>
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold text-slate-800 mb-2">Lower Scores = Better Protection</h4>
                <p className="text-slate-600 text-sm mb-4">
                  Virginia Tech STAR scores represent risk levels, so lower numbers indicate better protection.
                  A helmet with a score of 8.0 provides significantly better protection than one scored at 15.0.
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-slate-800 mb-2">Star Rating System</h4>
                <ul className="text-slate-600 text-sm space-y-1">
                  <li>⭐⭐⭐⭐⭐ 5 Stars: ≤ 10.0 (Excellent)</li>
                  <li>⭐⭐⭐⭐ 4 Stars: 10.1-15.0 (Good)</li>
                  <li>⭐⭐⭐ 3 Stars: 15.1-20.0 (Fair)</li>
                  <li>⭐⭐ 2 Stars: 20.1-25.0 (Marginal)</li>
                  <li>⭐ 1 Star: &gt; 25.0 (Not Recommended)</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Transparency Section */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-slate-800 mb-4">Transparency & Ethics</h2>
            <div className="bg-slate-50 p-6 rounded-lg">
              <h3 className="text-lg font-semibold text-slate-800 mb-3">Affiliate Partnerships</h3>
              <p className="text-slate-600 leading-relaxed mb-4">
                HelmetScore participates in affiliate programs with trusted retailers including Amazon and cycling specialty stores.
                When you purchase a helmet through our links, we may earn a small commission at no additional cost to you.
              </p>
              <p className="text-slate-600 leading-relaxed mb-4">
                <strong>Our commitment:</strong> Affiliate partnerships never influence our safety ratings or recommendations.
                All safety scores come directly from Virginia Tech's independent testing, and we present this data objectively
                regardless of commission rates or retailer relationships.
              </p>
              <p className="text-slate-600 leading-relaxed">
                Revenue from affiliate partnerships helps us maintain and improve the HelmetScore database, making this vital
                safety information freely accessible to all cyclists.
              </p>
            </div>
          </section>

          {/* Contact Section */}
          <section>
            <h2 className="text-2xl font-semibold text-slate-800 mb-4">Stay Connected</h2>
            <p className="text-slate-600 leading-relaxed mb-4">
              Have questions about helmet safety or suggestions for improving HelmetScore? We'd love to hear from you.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                href="/methodology"
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Learn About Our Methodology
              </Link>
              <Link
                href="/"
                className="bg-slate-200 text-slate-800 px-6 py-3 rounded-lg hover:bg-slate-300 transition-colors"
              >
                Explore the Database
              </Link>
            </div>
          </section>

        </div>
      </main>
    </div>
  );
}