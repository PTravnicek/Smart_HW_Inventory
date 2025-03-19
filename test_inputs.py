test_inputs = [
    "add resistor 10k ohm, 0603, 100 mW, 50 pieces",
    "capacitor 100 nF, 50V, X7R, 0805 SMD, qty: 25",
    "1N4148 diode, DO-35 package, 100V, 200mA, 10 pcs",
    "ATMEGA328P microcontroller, TQFP-32, 16MHz, qty:3",
    "EEPROM, 2.5-5.5V operating range, MSOP8 package, tme.cz:24LC32A-I/MS, 5 pcs",
    "Battery holder 18650, with pins, PCB mount, black plastic, quantity: 10",
    "dfrobot, gravity GNSS positioning module, TEL0157, 2 pcs",
    "RGB LED strip, WS2812B, 5V, IP65 waterproof, 60 LEDs/m, 2 meter length",
    "Add to inventory: 5mm tactile switch, 12x12mm, 7.3mm height, through-hole, 20 pieces",
    "JST-XH 2.54mm 4-pin connector male with 200mm 24AWG wire, Red/Black/Yellow/White, 5 sets",
    "Raspberry Pi 4 Model B with 4GB RAM, from raspberrypi.com, only 1 available",
    "100 pcs of M3x10mm hex socket head cap screws, stainless steel A2, for mounting PCBs",
    "0 ohm jumper resistor, 0805, qty:100",
    "Breadboard, 830 points, with power rails, from aliexpress:XYZ123456",
    "Box of mixed capacitors, approximately 50 pieces",
    "USB-C to USB-A cable, 1.5m length, black color, 28/24AWG, charging+data",
    "1 piece Nokia 5110 LCD module with PCB, mouser.com:LCD-10168",
    "2 pieces of MCP23017 16-bit I/O expander, I2C, SOIC-28",
    "qty:15 LM7805 voltage regulator, TO-220 package, 5V 1.5A",
    "digikey.com:296-6501-1-ND, TLV2462 dual op-amp, SOIC-8, rail-to-rail, 3 units",
    "Yellow LED, 5mm, 590nm wavelength, 20mA forward current, 2.1V forward voltage, diffused, 25 pcs",
    "Texas Instruments CD4017BE decade counter IC, DIP-16, 3-15V, CMOS, tme.eu:CD4017BE, 7 pieces",
    "HC-SR04 ultrasonic distance sensor module, 5V operating voltage, 2-400cm measurement range, 4-pin, 5 units",
    "add relay module, 5V coil, 10A/250VAC contacts, optoisolated, with mounting holes, qty:3"
]

# You can use this for automated testing
if __name__ == "__main__":
    # Example: Test regex parser
    from parser import parse_component
    
    for i, test_input in enumerate(test_inputs):
        print(f"\nTest #{i+1}: {test_input}")
        # Test with regex parser (LLM disabled)
        result = parse_component(test_input, use_llm=False)
        print(f"Regex Parser Result: {result}")
        
        # You can also test LLM parser if desired
        result_llm = parse_component(test_input, use_llm=True)
        print(f"LLM Parser Result: {result_llm}") 