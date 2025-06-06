import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

function Algorithms() {
  const [algorithms, setAlgorithms] = useState([]);

  useEffect(() => {
    fetch('/api/algorithms')
      .then(res => res.json())
      .then(data => setAlgorithms(data))
      .catch(err => console.error(err));
  }, []);

  return (
    <button>
      Add
    </button>
  );
}

export default Algorithms;