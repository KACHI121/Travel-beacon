import React from 'react';

const About = () => (
  <div className="max-w-4xl mx-auto py-12 px-4">
    <h1 className="text-4xl font-bold mb-8 text-center">About iguide</h1>
    <p className="text-lg text-gray-700 mb-10 text-center">
      iguide is built by a passionate team dedicated to making travel discovery and booking seamless for everyone.
    </p>
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8 justify-center mb-12">
      {/* Team Member 1 */}
      <div className="flex flex-col items-center bg-white rounded-xl shadow p-6">
        <img src="https://randomuser.me/api/portraits/men/1.jpg" alt="Wallace Kachingwe" className="w-24 h-24 rounded-full object-cover mb-4 border-4 border-primary" />
        <h3 className="font-bold text-lg mb-1">Wallace Kachingwe</h3>
        <p className="text-primary font-medium mb-1">Fullstack Developer</p>
        <p className="text-gray-500 text-sm text-center">Project Lead & Backend</p>
      </div>
      {/* Team Member 2 */}
      <div className="flex flex-col items-center bg-white rounded-xl shadow p-6">
        <img src="https://randomuser.me/api/portraits/women/2.jpg" alt="Jane Banda" className="w-24 h-24 rounded-full object-cover mb-4 border-4 border-primary" />
        <h3 className="font-bold text-lg mb-1">Jane Banda</h3>
        <p className="text-primary font-medium mb-1">Frontend Developer</p>
        <p className="text-gray-500 text-sm text-center">UI/UX & React</p>
      </div>
      {/* Team Member 3 */}
      <div className="flex flex-col items-center bg-white rounded-xl shadow p-6">
        <img src="https://randomuser.me/api/portraits/men/3.jpg" alt="Chipo Mwale" className="w-24 h-24 rounded-full object-cover mb-4 border-4 border-primary" />
        <h3 className="font-bold text-lg mb-1">Chipo Mwale</h3>
        <p className="text-primary font-medium mb-1">Mobile Developer</p>
        <p className="text-gray-500 text-sm text-center">React Native & Testing</p>
      </div>
      {/* Team Member 4 */}
      <div className="flex flex-col items-center bg-white rounded-xl shadow p-6">
        <img src="https://randomuser.me/api/portraits/women/4.jpg" alt="Linda Zulu" className="w-24 h-24 rounded-full object-cover mb-4 border-4 border-primary" />
        <h3 className="font-bold text-lg mb-1">Linda Zulu</h3>
        <p className="text-primary font-medium mb-1">DevOps Engineer</p>
        <p className="text-gray-500 text-sm text-center">Cloud & Deployment</p>
      </div>
      {/* Team Member 5 */}
      <div className="flex flex-col items-center bg-white rounded-xl shadow p-6">
        <img src="https://randomuser.me/api/portraits/men/5.jpg" alt="Gift Phiri" className="w-24 h-24 rounded-full object-cover mb-4 border-4 border-primary" />
        <h3 className="font-bold text-lg mb-1">Gift Phiri</h3>
        <p className="text-primary font-medium mb-1">QA Engineer</p>
        <p className="text-gray-500 text-sm text-center">Quality Assurance & Docs</p>
      </div>
    </div>
    <p className="mb-4 text-lg">
      <strong>iguide</strong> is your all-in-one travel companion, designed to help you discover, review, and book the best lodges and restaurants around the world. Our mission is to make travel planning seamless, social, and inspiring for everyone.
    </p>
    <ul className="list-disc pl-6 mb-4 text-base">
      <li>Find unique destinations with detailed information, photos, and user reviews.</li>
      <li>Leave your own reviews and ratings for places you visit.</li>
      <li>Book your stay or table directly through the platform.</li>
      <li>Save your favorite spots and build a personalized travel wishlist.</li>
      <li>Connect with a community of fellow travelers and foodies.</li>
    </ul>
    <p className="mb-4 text-base">
      Whether you are planning your next adventure or looking for a great place to eat, iguide is here to guide you every step of the way. We believe in authentic experiences, honest reviews, and making travel accessible to all.
    </p>
    <h2 className="text-2xl font-semibold mt-8 mb-2">Contact & Support</h2>
    <p className="mb-2">For support, feedback, or partnership inquiries, email us at <a href="mailto:support@iguide.com" className="text-primary underline">support@iguide.com</a>.</p>
    <h2 className="text-2xl font-semibold mt-8 mb-2">Open Source</h2>
    <p>
      iguide is open source! View and contribute to our code on <a href="https://github.com/KACHI121/Travel-beacon.git" target="_blank" rel="noopener noreferrer" className="text-primary underline">GitHub</a>.
    </p>
  </div>
);

export default About;
