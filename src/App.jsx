import { motion } from 'framer-motion'
import Header from './components/Header'
import Footer from './components/Footer'
import HeroSection from './components/HeroSection'

function App() {
  return (
    <motion.div
      className="min-h-screen"
      style={{ willChange: 'opacity' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 3, ease: [0.25, 0.1, 0.25, 1] }}
    >
      <Header />
      <HeroSection />
      <Footer />
    </motion.div>
  )
}

export default App
