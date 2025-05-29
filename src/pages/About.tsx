import React from 'react';
import Sidebar from '../components/Sidebar';

const About = () => (
  <div className="min-h-screen bg-gray-50 flex">
    <Sidebar />
    <div className="flex-1 ml-20 md:ml-64 flex flex-col min-h-screen">
      <main className="flex-grow">
        <div className="max-w-4xl mx-auto py-12 px-4">
          <h1 className="text-4xl font-bold mb-8 text-center">About iguide</h1>
          <p className="text-lg text-gray-700 mb-10 text-center">
            iguide is built by a passionate team dedicated to making travel discovery and booking seamless for everyone.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8 justify-center mb-12">            {/* Team Member 1 */}
            <div className="flex flex-col items-center bg-white rounded-xl shadow p-6">
              <img src="/images/team/wallace kchingwe.jpg" alt="Wallace Kachingwe" className="w-24 h-24 rounded-full object-cover mb-4 border-4 border-primary" />
              <h3 className="font-bold text-lg mb-1">Wallace Kachingwe</h3>
              <p className="text-gray-500 text-sm mb-1">2300063</p>
              <p className="text-primary font-medium mb-1">Team Lead</p>
            </div>
            {/* Team Member 2 */}
            <div className="flex flex-col items-center bg-white rounded-xl shadow p-6">
              <img src="/images/team/patrice chifumbe.jpg" alt="Patrice Chifumbe" className="w-24 h-24 rounded-full object-cover mb-4 border-4 border-primary" />
              <h3 className="font-bold text-lg mb-1">Patrice Chifumbe</h3>
              <p className="text-gray-500 text-sm mb-1">2300141</p>
              <p className="text-primary font-medium mb-1">Frontend Developer</p>
            </div>
            {/* Team Member 3 */}
            <div className="flex flex-col items-center bg-white rounded-xl shadow p-6">
              <img src="/images/team/marvin kalukwaya.jpg" alt="Marvin Kalukwaya" className="w-24 h-24 rounded-full object-cover mb-4 border-4 border-primary" />
              <h3 className="font-bold text-lg mb-1">Marvin Kalukwaya</h3>
              <p className="text-gray-500 text-sm mb-1">2300382</p>
              <p className="text-primary font-medium mb-1">Backend Developer</p>
            </div>            {/* Team Member 4 */}
            <div className="flex flex-col items-center bg-white rounded-xl shadow p-6">
              <img src="/images/team/placeholder.svg" alt="Musama Idan" className="w-24 h-24 rounded-full object-cover mb-4 border-4 border-primary" />
              <h3 className="font-bold text-lg mb-1">Musama Idan</h3>
              <p className="text-primary font-medium mb-1">Quality Assurance</p>
            </div>            {/* Team Member 5 */}
            <div className="flex flex-col items-center bg-white rounded-xl shadow p-6">
              <img src="/images/team/placeholder.svg" alt="Tapson Kayangwe" className="w-24 h-24 rounded-full object-cover mb-4 border-4 border-primary" />
              <h3 className="font-bold text-lg mb-1">Tapson Kayangwe</h3>
              <p className="text-gray-500 text-sm mb-1">2200307</p>
              <p className="text-primary font-medium mb-1">UI Designer</p>
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
      </main>
      <footer className="bg-white border-t py-8 mt-auto">
        <div className="max-w-4xl mx-auto px-4">
          <p className="text-center text-gray-500 text-sm">
            &copy; {new Date().getFullYear()} iguide. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  </div>
);

export default About;
