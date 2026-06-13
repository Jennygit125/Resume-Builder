export default function Contact() {
  return (
    <div className="max-w-4xl mx-auto px-8 py-16 text-center">
      <h1 className="text-4xl font-bold mb-4">Get In Touch</h1>
      <p className="text-gray-600 mb-12">Have questions? We're here to help you get hired.</p>
      <div className="bg-gray-50 p-8 rounded-2xl border border-gray-100 max-w-md mx-auto">
        <p className="text-lg font-medium mb-2">Email us at:</p>
        <a href="mailto:support@resumerunner.com" className="text-brand-blue text-2xl font-bold hover:underline">
          thrill.codex@gmail.com
        </a>
      </div>
    </div>
  );
}