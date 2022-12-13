import { useState } from 'react'
import reactLogo from './assets/react.svg'
import './App.css'


interface Employee {
  uniqueId: number;
  name: string;
  subordinates: Employee[];
}

interface IEmployeeOrgApp {
  ceo: Employee;
  /**
  * Moves the employee with employeeID (uniqueId) under a supervisor
  (another employee) that has supervisorID (uniqueId).
  * E.g. move Bob (employeeID) to be subordinate of Georgina
  (supervisorID). * @param employeeID
  * @param supervisorID
  */
  move(employeeID: number, supervisorID: number): void;
  /** Undo last move action */
  undo(): void;
  /** Redo last undone action */
  redo(): void;
}

interface ILastUpdate {
  employeeID: number,
  prevSpv: number,
  newSpv: number,
  previousSubordinates: number[]
}

class EmployeeOrgApp implements IEmployeeOrgApp {
  ceo: Employee;
  private updateHistory: ILastUpdate[];
  private currentIndex: number | null;

  constructor(ceo: Employee) {
    this.ceo = ceo
    this.updateHistory = []
    this.currentIndex = null
  }

  move(employeeID: number, newSpvID: number) {
    let employee: Employee = this.getEmployees(this.ceo, employeeID)
    let newSpv: Employee = this.getEmployees(this.ceo, newSpvID)
    let oldSpv: Employee = this.getEmployees(this.ceo, employeeID, true)

    if (newSpv.subordinates.includes(employee)) console.log('already under this supervisor')
    else {
      let employeeSubordinateIDs = employee.subordinates.map(item => item.uniqueId)
      this.setNewValues(newSpv, oldSpv, employee)
      this.updateHistory.push({ employeeID: employee.uniqueId, prevSpv: oldSpv.uniqueId, newSpv: newSpv.uniqueId, previousSubordinates: employeeSubordinateIDs })
    }
  }

  undo() {
    console.log('undo')
    if (this.currentIndex && this.currentIndex < 1) console.log('can not undo anymore')
    else {
      this.currentIndex = this.updateHistory.length - 1
      const lastUpdate = this.updateHistory[this.currentIndex]

      // get the employee
      let employee: Employee = this.getEmployees(this.ceo, lastUpdate.employeeID)

      // get the new supervisor (which is his previous supervisor)
      let newSpv: Employee = this.getEmployees(this.ceo, lastUpdate.prevSpv)

      // get his previous supervisor (which is his current supervisor)
      let oldSpv: Employee = this.getEmployees(this.ceo, lastUpdate.employeeID, true)


      let employeeSubordinatesID = lastUpdate.previousSubordinates

      // find employees that is used subordinated by this employee
      employeeSubordinatesID.forEach(item => {
        // get the employee that subordinated
        const subordinate = this.getEmployees(this.ceo, item)

        // get his current supervisor
        let spvOfSubordinate: Employee = this.getEmployees(this.ceo, item, true)

        // remove this employee from his current supervisor
        spvOfSubordinate.subordinates = spvOfSubordinate.subordinates.filter(sub => sub.uniqueId !== item)

        // subordinate this employee to selected employee
        employee.subordinates.push(subordinate)
      })

      // add this employee to his new subordinate
      newSpv.subordinates.push(employee)

      // remove this employee from his previous subordinate
      oldSpv.subordinates = oldSpv.subordinates.filter(item => item.uniqueId !== employee.uniqueId)

      console.log(this.ceo)

    }
  }

  redo() {
    console.log('redo')
  }


  private setNewValues(newSpv: Employee, oldSpv: Employee, employee: Employee) {

    // this.setNewValues(newSpv, oldSpv, employee)

    let employeeSubordinates = employee.subordinates

    // move employee subordinate to his old spv
    for (let subordinate of employeeSubordinates) {
      oldSpv.subordinates.push(subordinate)
    }

    // empty his current subordinates
    employee.subordinates = []

    // add the employee under new spv subordinates
    newSpv.subordinates.push(employee)

    // remove the current employee from his old spv
    oldSpv.subordinates = oldSpv.subordinates.filter(item => item.uniqueId !== employee.uniqueId)

    // console.log('after update', this.ceo)

  }

  // private setEmployees(spv: Employee, employee: Employee) {
  //   if (spv.uniqueId === employee.uniqueId) { spv.subordinates === employee.subordinates; return true }
  //   else {
  //     if (spv.subordinates.length > 0) {
  //       for (let subordinate of spv.subordinates) {
  //         const res: any = this.setEmployees(subordinate, employee)
  //         if (res) return true
  //       }
  //     }
  //   }
  // }

  private getEmployees(spv: Employee, employeeID: number, getSpv: boolean = false) {
    // check if this employee subordinate the wanted employee 
    const empl = spv.subordinates.find(item => item.uniqueId === employeeID)
    if (empl) {
      // if employee found, and current search mode is to get the spv, then return the spv
      if (getSpv) return spv
      // else return the employee data
      else return empl
    } else {
      // if not found, then check the subordinates of this employee
      if (spv.subordinates.length > 0) {
        for (let subordinate of spv.subordinates) {
          const res: any = this.getEmployees(subordinate, employeeID, getSpv)
          // if employee is found, then return the employee
          if (res) {
            return res
          }
        }
      }
    }
  }
}

const ceo: Employee = {
  uniqueId: 1,
  name: 'Mark Zuckerberg',
  subordinates: [{
    uniqueId: 2,
    name: 'Sarah Donald',
    subordinates: [{
      uniqueId: 4,
      name: 'Cassandra Reynolds',
      subordinates: [{
        uniqueId: 5,
        name: 'Mary Blue',
        subordinates: []
      }, {
        uniqueId: 6,
        name: 'Bob Saget',
        subordinates: [{
          uniqueId: 7,
          name: 'Tina Teff',
          subordinates: [{
            uniqueId: 8,
            name: 'Will Turner',
            subordinates: []
          }]
        }]
      }]
    }]
  }, {
    uniqueId: 3,
    name: 'Tyler Simpson',
    subordinates: []
  }]
}

function App() {
  const [count, setCount] = useState(0)
  let employees: Employee[] = []

  const App = new EmployeeOrgApp(ceo)

  function getEmployees(head: Employee) {
    if (head.subordinates.length > 0) {
      for (let subordinate of head.subordinates) {
        getEmployees(subordinate)
      }
    }
    employees.push(head)
  }

  getEmployees(App.ceo)

  function moveEmployee() {
    // const employeeID: any = window.prompt('Select employee Id')
    // let targetEmployee: any

    // if (+employeeID) {
    //   targetEmployee = window.prompt('Will be moved under subordinates of: (insert Employee ID)')
    //   App.move(+employeeID, +targetEmployee)
    // }

    App.move(6, 7)
    console.log('after update', App.ceo)

  }

  // console.log(employees)

  return (
    <div className="App">
      <div>
        <a href="https://vitejs.dev" target="_blank">
          <img src="/vite.svg" className="logo" alt="Vite logo" />
        </a>
        <a href="https://reactjs.org" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <h1>Vite + React</h1>
      <div className="card">
        <button onClick={() => setCount((count) => count + 1)}>
          count is {count}
        </button>
        <p>
          Edit <code>src/App.tsx</code> and save to test HMR
        </p>
      </div>
      <p className="read-the-docs">
        Click on the Vite and React logos to learn more
      </p>
      <button onClick={() => App.undo()}>
        Undo
      </button>
      <button onClick={moveEmployee}>
        Move an Employee
      </button>

    </div>
  )
}

export default App
