import './App.css';
import Card from './Card.js';
import Header from './Header.js';
import Footer from './Footer.js';

function App() {
  return (
    <>
      <Header />
      <div className="card-container">
        <Card />
        <Card />
        <Card />
      </div>
      <Footer />
    </>
  );
}

export default App;
