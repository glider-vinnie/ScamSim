import React from 'react'
import { Link } from 'react-router-dom'
import { FileQuestion, Home, BookOpen } from 'lucide-react'
import { Button } from '../components/ui'

export const NotFoundPage: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center space-y-4">
      <div className="p-4 bg-mist/30 text-navy rounded-full">
        <FileQuestion size={48} />
      </div>
      <h1 className="text-3xl font-extrabold text-navy">Page Not Found</h1>
      <p className="text-sm text-muted max-w-md">
        The simulation page or route you requested does not exist or has expired.
      </p>
      <div className="flex gap-3 pt-2">
        <Link to="/">
          <Button variant="primary" className="gap-2">
            <Home size={16} />
            <span>Go Home</span>
          </Button>
        </Link>
        <Link to="/library">
          <Button variant="secondary" className="gap-2">
            <BookOpen size={16} />
            <span>Browse Library</span>
          </Button>
        </Link>
      </div>
    </div>
  )
}

export default NotFoundPage
