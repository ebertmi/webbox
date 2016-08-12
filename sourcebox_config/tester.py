import os
import sys

# Set the current working dir to the project
if len(sys.argv) < 2:
    print("No project path supplied for the tester")
    sys.exit()

path = sys.argv[1]

os.chdir(path)

import unittest
from test_utils import JSONTestRunner

def testcases_in_module(module):
    md = module.__dict__
    return [
        md[c] for c in md if (
            isinstance(md[c], type) and md[c].__module__ == module.__name__ and issubclass(md[c], unittest.TestCase)
        )
    ]

try:
    import tests
except:
    print("Es wurden keine Tests angelegt.")
    sys.exit()

testcases = testcases_in_module(tests)

# We currently support only one testcase
if len(testcases) == 1:
    testcase = testcases[0]
    suite = unittest.TestLoader().loadTestsFromTestCase(testcase)
    testResult = JSONTestRunner(verbosity=2).run(suite)
else:
    print("Ungültige Tests")