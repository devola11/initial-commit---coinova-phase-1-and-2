import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer className="bg-[#141519] border-t border-[#1E2025] mt-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-[#5B616E] text-xs">&copy; 2026 Coinova. All rights reserved.</div>
          <div className="flex flex-wrap gap-4 text-xs">
            <Link to="/terms" className="text-[#8A919E] hover:text-white no-underline transition-colors">Terms</Link>
            <Link to="/privacy" className="text-[#8A919E] hover:text-white no-underline transition-colors">Privacy</Link>
            <Link to="/faq" className="text-[#8A919E] hover:text-white no-underline transition-colors">FAQ</Link>
            <Link to="/contact" className="text-[#8A919E] hover:text-white no-underline transition-colors">Contact</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
