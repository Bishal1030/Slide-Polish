import Header from './components/Header'
import Footer from './components/Footer'

function App() {
  return (
    <div className="min-h-screen">
      <Header />
      <main className="min-h-[calc(100vh-200px)]">
        {/* Content goes here */}
      </main>
      <Footer />
    </div>
  )
}

export default App
