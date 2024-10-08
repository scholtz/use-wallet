#!/bin/bash

find examples -type f -name "*" -print0 | xargs -0 sed -i -e  "s~use-wallet~avm-wallet~g" -e  "s~@txnlab~@biatec~g" -e  "s~github.com/txnlab/avm-wallet~github.com/scholtz/avm-wallet~g" -e 's~"directory": "packages/avm-wallet~"directory": "packages/use-wallet~g' -e "s~github/package-json/v/TxnLab/avm-wallet~github/package-json/v/scholtz/avm-wallet~g" -e "s~github/license/TxnLab/avm-wallet~github/license/scholtz/avm-wallet~g" -e "s~github.com/TxnLab/avm-wallet~github.com/scholtz/avm-wallet~g"
find packages -type f -name "*" -print0 | xargs -0 sed -i -e  "s~use-wallet~avm-wallet~g" -e  "s~@txnlab~@biatec~g" -e  "s~github.com/txnlab/avm-wallet~github.com/scholtz/avm-wallet~g" -e 's~"directory": "packages/avm-wallet~"directory": "packages/use-wallet~g' -e "s~github/package-json/v/TxnLab/avm-wallet~github/package-json/v/scholtz/avm-wallet~g" -e "s~github/license/TxnLab/avm-wallet~github/license/scholtz/avm-wallet~g" -e "s~github.com/TxnLab/avm-wallet~github.com/scholtz/avm-wallet~g"

find examples -type f -name "*" -print0 | xargs -0 sed -i -e "s~@biatec/avm-wallet~avm-wallet~g"
find packages -type f -name "*" -print0 | xargs -0 sed -i -e "s~@biatec/avm-wallet~avm-wallet~g"

sed -i -e 's~@txnlab~@biatec~g' -e 's~use-wallet~avm-wallet~g' -e 's~github.com/txnlab~github.com/scholtz~g' -e 's~@biatec/~~g' package.json


sed -i -e 's~@txnlab~@biatec~g' -e 's~use-wallet~avm-wallet~g' -e 's~TxnLab/use-wallet~scholtz/avm-wallet~g' -e 's~gitbook.io/avm-wallet~gitbook.io/use-wallet~g' README.md
sed -i -e 's~@txnlab~@biatec~g' -e 's~use-wallet~avm-wallet~g' CONTRIBUTING.md

sed -i -e 's~@biatec/~~g' -e 's~gitbook.io/avm-wallet~gitbook.io/use-wallet~g' README.md
sed -i -e 's~@biatec/~~g' CONTRIBUTING.md

sed -i -e 's~TxnLab Inc.~TxnLab Inc., Scholtz \& Company, jsa~g' -e 's~Scholtz \& Company, jsa, Scholtz \& Company, jsa~Scholtz \& Company, jsa~g' LICENSE.md

find examples -type f -name "*" -print0 | xargs -0 sed -i -e "s~avm-wallet-example~example-avm-wallet~g"

find packages -type f -name "*" -print0 | xargs -0 sed -i -e "s~activeWallet~avmActiveWallet~g"
find examples -type f -name "*" -print0 | xargs -0 sed -i -e "s~activeWallet~avmActiveWallet~g"
find packages -type f -name "*" -print0 | xargs -0 sed -i -e "s~AVMState~AVMAVMState~g"
find examples -type f -name "*" -print0 | xargs -0 sed -i -e "s~AVMState~AVMAVMState~g"
find packages -type f -name "*" -print0 | xargs -0 sed -i -e "s~setAVMState~setState~g"
find examples -type f -name "*" -print0 | xargs -0 sed -i -e "s~setAVMState~setState~g"

find packages -type f -name "*" -print0 | xargs -0 sed -i -e "s~useAVMState~useState~g"
find examples -type f -name "*" -print0 | xargs -0 sed -i -e "s~useAVMState~useState~g"

find packages -type f -name "*" -print0 | xargs -0 sed -i -e "s~SetAVMState~SetState~g"
find examples -type f -name "*" -print0 | xargs -0 sed -i -e "s~SetAVMState~SetState~g"
