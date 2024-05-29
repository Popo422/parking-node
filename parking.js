class ParkingSlot {
  constructor(slotId, slotType, distances) {
    this.slotId = slotId;
    this.slotType = slotType; // 0: SP, 1: MP, 2: LP
    this.distances = distances;
    this.isOccupied = false;
  }
}

class Vehicle {
  constructor(vehicleType) {
    this.vehicleType = vehicleType; // 'S', 'M', 'L'
    this.entryTime = null;
    this.exitTime = null;
    this.parkingSlot = null;
  }
}
class ParkingLot {
  constructor(entryPoints, slotDistances, slotSizes) {
    this.entryPoints = entryPoints;
    this.slots = slotSizes.map(
      (size, i) => new ParkingSlot(i, size, slotDistances[i])
    );
    this.parkedVehicles = new Map();
    this.lastExitTime = new Map();
  }

  findNearestSlot(vehicleType, entryPoint) {
    const eligibleSlots = this.slots.filter(
      (slot) => !slot.isOccupied && this.isEligible(slot, vehicleType)
    );
    eligibleSlots.sort(
      (a, b) => a.distances[entryPoint] - b.distances[entryPoint]
    );
    console.log("eligibleSlots", eligibleSlots);
    return eligibleSlots.length ? eligibleSlots[0] : null;
  }

  isEligible(slot, vehicleType) {
    if (vehicleType === "S") return true;
    if (vehicleType === "M" && slot.slotType > 0) return true;
    if (vehicleType === "L" && slot.slotType === 2) return true;
    return false;
  }

  parkVehicle(vehicle, entryPoint) {
    const slot = this.findNearestSlot(vehicle.vehicleType, entryPoint);
    if (!slot) throw new Error("No available slot for the vehicle type.");
    slot.isOccupied = true;
    vehicle.entryTime = new Date();
    vehicle.parkingSlot = slot;
    this.parkedVehicles.set(vehicle.entryTime.getTime(), vehicle);
  }

  unparkVehicle(vehicle) {
    vehicle.exitTime = new Date();
    vehicle.parkingSlot.isOccupied = false;
    const duration = Math.ceil(
      (vehicle.exitTime - vehicle.entryTime) / (1000 * 60 * 60)
    ); // in hours
    const fee = this.calculateFee(vehicle.parkingSlot.slotType, duration);

    // Check for continuous rate
    const lastExitTime = this.lastExitTime.get(vehicle);

    if (
      lastExitTime &&
      (vehicle.entryTime - lastExitTime) / (1000 * 60 * 60) <= 1
    ) {
      const previousDuration = Math.ceil(
        (lastExitTime - vehicle.entryTime) / (1000 * 60 * 60)
      );
      return this.calculateFee(
        vehicle.parkingSlot.slotType,
        duration + previousDuration
      );
    }

    this.lastExitTime.set(vehicle, vehicle.exitTime);
    console.log(vehicle, vehicle.exitTime);
    console.log("lastExitTime", this.lastExitTime);
    this.parkedVehicles.delete(vehicle.entryTime.getTime());
    return fee;
  }

  calculateFee(slotType, duration) {
    if (duration <= 3) return 40;

    const flatRate = 40;
    const excessHours = duration - 3;
    const hourlyRates = [20, 60, 100];
    const hourlyRate = hourlyRates[slotType];

    let fee = flatRate + hourlyRate * excessHours;

    if (duration > 24) {
      const days = Math.floor(duration / 24);
      const remainderHours = duration % 24;
      fee = days * 5000 + this.calculateFee(slotType, remainderHours);
    }

    return fee;
  }
}

// Example usage
const entryPoints = 3;
const slotDistances = [
  [1, 4, 5],
  [3, 2, 3],
  [2, 1, 4],
];
const slotSizes = [0, 2, 1]; // 0: SP, 1: MP, 2: LP
const parkingLot = new ParkingLot(entryPoints, slotDistances, slotSizes);
const vehicle1 = new Vehicle("S");
parkingLot.parkVehicle(vehicle1, 1); //revised to add parking slot

// Simulate some time passing
setTimeout(() => {
  const fee = parkingLot.unparkVehicle(vehicle1);
  console.log(`Parking fee: ${fee} pesos`);
}, 5);
