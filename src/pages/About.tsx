import React from 'react';

const About = () => (
  <div className="max-w-3xl mx-auto py-12 px-4">
    <h1 className="text-4xl font-bold mb-6">About iguide</h1>
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
