import sys
import unittest
from pathlib import Path

# Allow importing backend/app.py when tests run from repo root.
BACKEND_DIR = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BACKEND_DIR))

from app import EmissionCalculator  # noqa: E402


class TestEmissionCalculator(unittest.TestCase):
    def test_transport_emissions(self):
        actual = EmissionCalculator.calculate_transport_emissions(30, "sedan")
        expected = 30 * EmissionCalculator.TRANSPORT_EMISSIONS["sedan"]
        self.assertAlmostEqual(actual, expected)

    def test_transport_fallback_emissions(self):
        actual = EmissionCalculator.calculate_transport_emissions(10, "unknown")
        expected = 10 * 0.192
        self.assertAlmostEqual(actual, expected)

    def test_diet_emissions(self):
        actual = EmissionCalculator.calculate_diet_emissions(3, "non-vegetarian")
        expected = 3 * EmissionCalculator.DIET_EMISSIONS["non-vegetarian"]
        self.assertAlmostEqual(actual, expected)

    def test_diet_fallback_emissions(self):
        actual = EmissionCalculator.calculate_diet_emissions(3, "unknown")
        expected = 3 * 3.5
        self.assertAlmostEqual(actual, expected)

    def test_electricity_emissions(self):
        actual = EmissionCalculator.calculate_electricity_emissions(400)
        expected = 400 * EmissionCalculator.ELECTRICITY_EMISSION_FACTOR
        self.assertAlmostEqual(actual, expected)

    def test_gas_emissions(self):
        actual = EmissionCalculator.calculate_gas_emissions(20)
        expected = 20 * EmissionCalculator.GAS_EMISSION_FACTOR
        self.assertAlmostEqual(actual, expected)

    def test_water_emissions(self):
        actual = EmissionCalculator.calculate_water_emissions(15000)
        expected = (15000 / 1000) * EmissionCalculator.WATER_EMISSION_FACTOR
        self.assertAlmostEqual(actual, expected)

    def test_annual_emissions_aggregation(self):
        actual = EmissionCalculator.calculate_annual_emissions(
            30,
            "sedan",
            0,
            0,
            3,
            "non-vegetarian",
            400,
            20,
            15000,
        )
        expected = (
            (
                EmissionCalculator.calculate_transport_emissions(30, "sedan")
                + EmissionCalculator.calculate_transport_emissions(0, "bike")
                + EmissionCalculator.calculate_transport_emissions(0, "walk")
            )
            * 365
            + EmissionCalculator.calculate_diet_emissions(3, "non-vegetarian") * 365
            + (
                EmissionCalculator.calculate_electricity_emissions(400)
                + EmissionCalculator.calculate_gas_emissions(20)
                + EmissionCalculator.calculate_water_emissions(15000)
            )
            * 12
        )
        self.assertAlmostEqual(actual, expected)

    def test_annual_cost(self):
        actual = EmissionCalculator.calculate_annual_cost(400, 20, 15000)
        expected = ((400 * 7.0) + (20 * 80.0) + ((15000 / 1000) * 30.0)) * 12
        self.assertAlmostEqual(actual, expected)

    def test_savings_positive_when_improved_scenario_is_better(self):
        current = EmissionCalculator.calculate_annual_emissions(
            30,
            "sedan",
            0,
            0,
            3,
            "non-vegetarian",
            400,
            20,
            15000,
        )
        improved = EmissionCalculator.calculate_annual_emissions(
            15,
            "electric",
            5,
            2,
            3,
            "vegetarian",
            250,
            10,
            10000,
        )
        self.assertGreater(current - improved, 0)


if __name__ == "__main__":
    unittest.main()
