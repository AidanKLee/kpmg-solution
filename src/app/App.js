import { useEffect, useMemo, useRef, useState } from 'react';
import { Button, Dropdown, Modal } from 'react-bootstrap';
import Map from '../components/map/Map';
import { Table } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faExpand, faFilter, faCompress, faXmark } from '@fortawesome/free-solid-svg-icons';
import './App.css';
import 'bootstrap/dist/css/bootstrap.css';

const endpoint = 'https://run.mocky.io/v3/7cb595ed-2882-4dc7-8179-d38d0b9c9d13';

const App = () => {

  const [ companies, setCompanies ] = useState([]);
  const [ menuFS, setMenuFS ] = useState(false);
  const [ modalShow, setModalShow] = useState(false);
  const [ selectedRow, setSelectedRow ] = useState(1);
  const [ filter, setFilter ] = useState({
    fees: { min: 0, max: 0},
    sector: []
  })

  const filterValues = useMemo(() => {

    const getFeefilterValues = () => {
      let minValue = Math.floor(Math.min(...companies.map(company => company.fees.amount)));
      let maxValue = Math.floor(Math.max(...companies.map(company => company.fees.amount)));

      setFilter({
        ...filter,
        fees: { min: minValue, max: maxValue }
      })

      return [minValue, maxValue];
    }

    const getSectorfilterValues = () => {
      let values = [];

      companies.forEach(company => {
        if (!values.includes(company.sector)) {
          values.push(company.sector);
        }
      })

      return values;
    }

    return { 
      fees: getFeefilterValues(),
      sector: getSectorfilterValues()
    };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companies])

  const filteredCompanies = useMemo(() => {
    return companies.filter(company => {
      const isSelectedSector = filter.sector.length === 0 || filter.sector.includes(company.sector);
      const inFeesRange = company.fees.amount >= filter.fees.min && company.fees.amount <= filter.fees.max + 1;
      return isSelectedSector && inFeesRange;
    })
  }, [companies, filter])

  const selectedData = useMemo(() => {
    return companies.filter(company => company.id === selectedRow)[0];
  }, [companies, selectedRow])

  const leafletRef = useRef(null);
  const menuRef = useRef(null);
  const mapRef = useRef(null);

  useEffect(() => {
    getCompanies();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const getCompanies = async () => {
      let data = await fetch(endpoint);
      data = await data.json();
      setCompanies(data);
  }

  const toggleMenu = () => {
    if (menuRef.current && mapRef.current) {

      const menuOpen = menuRef.current.classList.contains('open');

      if (menuOpen) {

        toggleFullscreen(true);
        menuRef.current.classList.remove('open');
        mapRef.current.classList.remove('menu-open');

      } else {

        menuRef.current.classList.add('open');
        mapRef.current.classList.add('menu-open');

      }

    }
  }

  const toggleFullscreen = close => {
    if (menuFS || close) {

      setMenuFS(false);
      menuRef.current.classList.remove('fullscreen');
      mapRef.current.classList.remove('menu-fullscreen');

    } else {

      setMenuFS(true);
      menuRef.current.classList.add('fullscreen');
      mapRef.current.classList.add('menu-fullscreen');

    }
  }

  const handleFilterChange = e => {
    const type = e.target.name;
    const value = e.target.value;
    if (type === 'min' || type === 'max') {
      setFilter({
        ...filter,
        fees: {
          ...filter.fees,
          [type]: Number(value)
        }
      })
    } else {
      if (e.target.checked) {
        setFilter({
          ...filter,
          [type]: [...filter[type], value]
        })
      } else {
        setFilter({
          ...filter,
          [type]: filter[type].filter(val => value !== val)
        })
      }
    }

  }

  const handleClose = () => setModalShow(false);
  const handleShow = () => setModalShow(true);

  return (
    <div id="app">

      <Map
        companies={ filteredCompanies }
        handleToggleMenu={ toggleMenu }
        leafletRef= { leafletRef }
        mapRef={ mapRef }
      />

      {
        companies.length > 0 ? (
          <Modal show={ modalShow } onHide={handleClose} centered>
            <Modal.Header closeButton>
              <Modal.Title>{ selectedData.company }</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <h6>Address</h6>
              <p>{ selectedData.address }</p>
              <h6>Sector</h6>
              <p>{ selectedData.sector }</p>
              <h6>Fees</h6>
              <p>{ selectedData.fees.amount } <b>{ selectedData.fees.currency }</b></p>
              <h6>Stock Symbol</h6>
              <p>{ selectedData.stockSymbol }</p>
            </Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" onClick={handleClose}>
                Close
              </Button>
            </Modal.Footer>
          </Modal>
        ) : undefined
      }

      <div id='menu' ref={ menuRef }>

        <header id="menu-header">

          <div className='left'>

            <Dropdown>

              <Dropdown.Toggle className="border" variant="light">
                <FontAwesomeIcon icon={ faFilter }/>
              </Dropdown.Toggle>

              <Dropdown.Menu>

                <Dropdown.Header>Fees</Dropdown.Header>

                <div className="dropdown-item">
                  <span>From</span> <input onChange={ handleFilterChange } name="min" type="number" defaultValue={ filter.fees.min } min={ filterValues.fees[0] } max={ filter.fees.max } />
                  <span>To</span> <input onChange={ handleFilterChange } name="max" type="number" defaultValue={ filter.fees.max } min={ filter.fees.min } max={ filterValues.fees[1] } />
                </div>

                <Dropdown.Divider/>

                <Dropdown.Header>Sector</Dropdown.Header>

                {
                  filterValues.sector.map(filter => {
                    return (
                      <label className="dropdown-item" key={filter}>
                        <input onChange={ handleFilterChange } type="checkbox" name="sector" value={ filter } />
                        { filter }
                      </label>
                    )
                  })
                }

              </Dropdown.Menu>
              
            </Dropdown>

          </div>

          <div className='right'>

            <Button
              className='btn-light border'
              onClick={() => toggleFullscreen()}
              >
              <FontAwesomeIcon icon={ menuFS ? faCompress : faExpand }/>
            </Button>

            <Button
              className='btn-light border'
              onClick={() => toggleMenu()}
              >
              <FontAwesomeIcon icon={ faXmark }/>
            </Button>

          </div>

        </header>

        <Table striped hover>

          <thead>
            <tr>
              <th>Company</th>
              <th>Address</th>
              <th>Sector</th>
              <th>Fees</th>
              <th>Stock Symbol</th>
            </tr>
          </thead>

          <tbody>
            {
              filteredCompanies.map(company => {

                return (
                  <TableRow 
                    data={ company } 
                    key={ company.id } 
                    handleModalShow={ handleShow }
                    selectedRow={ [ selectedRow, setSelectedRow ] }
                    />
                )

              })
            }
          </tbody>

        </Table>

      </div>

    </div>
  )

}

const TableRow = props => {

  const { 
    data,
    handleModalShow,
    selectedRow: [ , setSelectedRow ]
  } = useMemo(() => props, [props]);

  const {
    company,
    address,
    fees,
    id,
    sector,
    stockSymbol
  } = useMemo(() => data, [data]);

  const handleRowSelect = e => {
    document.querySelectorAll('.company-data').forEach(row => {
      row.classList.remove('selected');
    })

    handleModalShow();

    setSelectedRow(id);

    e.target.parentElement.classList.add('selected');
  }

  return (
    <tr id={ id } className='company-data' onClick={ handleRowSelect }>
      <td>{ company }</td>
      <td>{ address }</td>
      <td>{ sector }</td>
      <td>{ fees.amount } <b>{ fees.currency }</b> </td>
      <td>{ stockSymbol }</td>
    </tr>
  )

}

export default App;