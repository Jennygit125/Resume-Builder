function ListGroup(){
    const items = [
        'New York',
         'San Francisco', 'Los Angeles', 'Chicago', 'Houston', 'Philadelphia'];

    return( <ul className="list-group">
       {items.map((item) => <li className="list-group-item" key={item }>{item}</li
       >)};

    </ul>
    );
}
export default ListGroup;