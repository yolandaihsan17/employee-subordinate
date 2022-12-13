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
  private updateHistory: ILastUpdate[]; // to save the history of user action, the changes of organization
  private currentIndex: number; //to indicate user redo and undo action, if < 0, that means user still hasn't done any changes

  constructor(ceo: Employee) {
    this.ceo = ceo
    this.updateHistory = []
    this.currentIndex = -1
  }

  move(employeeID: number, newSpvID: number) {
    // find the employee
    let employee: Employee = this.getEmployees(this.ceo, employeeID)

    // if employee found, then get his new supervisor, and his current supervisor
    if (employee) {
      let newSpv: Employee = this.getEmployees(this.ceo, newSpvID) //get his new supervisor
      let oldSpv: Employee = this.getEmployees(this.ceo, employeeID, true) //get his current supervisor

      // if this employee already under this supervisor, then do nothing
      if (newSpv.subordinates.includes(employee)) console.log('already under this supervisor')

      else {
        // get all employees id that under this employee
        let employeeSubordinateIDs = employee.subordinates.map(item => item.uniqueId)

        // reassign this employee subordinates, 
        // reassign his current supervisor subordinates (remove him from his current supervisor), 
        // and assign him to new supervisor
        this.setNewValues(newSpv, oldSpv, employee)

        // so if user previously already do the undo method, take update history only from start until the current index
        if (this.updateHistory.length > 0 && this.currentIndex < this.updateHistory.length) {
          this.updateHistory = this.updateHistory.slice(0, this.currentIndex)
        }

        // then push this update to update history variable
        this.updateHistory.push({ employeeID: employee.uniqueId, prevSpv: oldSpv.uniqueId, newSpv: newSpv.uniqueId, previousSubordinates: employeeSubordinateIDs })
        this.currentIndex = this.updateHistory.length

        console.log(`${employee.name} moved to be under ${newSpv.name}`)
        console.log('Update history:', this.updateHistory)
      }
    } else {
      window.alert('no employee found with that id')
      return;
    }
  }

  undo() {
    console.log('undo')
    if (this.currentIndex === 0) console.log('can not undo anymore')
    else {
      this.currentIndex = this.currentIndex < 0 ? this.updateHistory.length : this.currentIndex
      console.log('current index', this.currentIndex)
      const lastUpdate = this.updateHistory[this.currentIndex - 1]

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

      this.currentIndex--

    }
  }

  redo() {
    console.log('redo')
    if (this.currentIndex >= (this.updateHistory.length) || this.currentIndex < 0) console.log('can not redo anymore')
    else {
      console.log(this.currentIndex)
      this.currentIndex++
      const lastUpdate = this.updateHistory[this.currentIndex - 1]

      // get the employee
      let employee: Employee = this.getEmployees(this.ceo, lastUpdate.employeeID)

      // get the new supervisor (which is his previous supervisor)
      let newSpv: Employee = this.getEmployees(this.ceo, lastUpdate.newSpv)

      // get his previous supervisor (which is his current supervisor)
      let oldSpv: Employee = this.getEmployees(this.ceo, lastUpdate.employeeID, true)

      this.setNewValues(newSpv, oldSpv, employee)

      console.log(employee, newSpv, oldSpv, this.ceo)

      // this.currentIndex--
    }
  }


  private setNewValues(newSpv: Employee, oldSpv: Employee, employee: Employee) {

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
  // let employees: Employee[] = []

  const App = new EmployeeOrgApp(ceo)

  // function getEmployees(head: Employee) {
  //   if (head.subordinates.length > 0) {
  //     for (let subordinate of head.subordinates) {
  //       getEmployees(subordinate)
  //     }
  //   }
  //   employees.push(head)
  // }

  // getEmployees(App.ceo)

  function moveEmployee() {
    const employeeID: any = window.prompt('Select employee Id')
    let targetEmployee: any

    if (+employeeID === 1) {
      window.alert('opps, dont move the CEO >:| ')
    } else {
      if (+employeeID) {
        targetEmployee = window.prompt('Will be moved under subordinates of: (insert Employee ID)')
        App.move(+employeeID, +targetEmployee)
      }
    }

    console.log('after update', App.ceo)

  }

  return (
    <div className="App">
      <h1>Please check the log</h1>
      <button onClick={() => App.undo()}>
        Undo
      </button>
      <button onClick={moveEmployee} style={{ margin: '0px 12px' }}>
        Move an Employee
      </button>
      <button onClick={() => App.redo()}>
        Redo
      </button>

    </div>
  )
}

export default App
