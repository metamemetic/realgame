<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use OpenNode\OpenNode;

OpenNode::config(array(
    'environment'               => 'dev', // dev OR live
    'auth_token'                => env('OPENNODE_KEY_DEV'),
    'curlopt_ssl_verifypeer'    => TRUE // default is false
));

class OpenNodeController extends Controller
{
    /**
     * Generate demo charge
     */
    public function demo_charge()
    {
        $charge_params = array(
                           'description'       => '1 Arcade Token', //Optional
                           'amount'            => 0.25,
                           'currency'          => 'USD', //Optional
                           'order_id'          => 'YOUR-PLATFORM-ID', //Optional
                           'email'             => 'johndoe@example.com', //Optional
                           'name'              => 'John Doe', //Optional
                           'callback_url'      => 'https://site.com/?handler=opennode', //Optional
                           'success_url'       => 'https://example.com/order/abc123', //Optional
                           'auto_settle'       => false //Optional
                       );

        try {
            $charge = \OpenNode\Merchant\Charge::create($charge_params);

            echo 'Charge id: ' . $charge->id;
            echo '<br /><br />';

            echo 'LN BOLT11: ' . $charge->lightning_invoice['payreq'];
            echo '<br /><br />';

            echo 'BTC address: ' . $charge->chain_invoice['address'];
            echo '<br /><br />';
            dd($charge);
        } catch (Exception $e) {
            echo $e->getMessage(); // InvalidRequest Error creating order
        }
    }

    /**
     * Check status of charge
     */
    public function charge_info()
    {
        try {
            $charge = \OpenNode\Merchant\Charge::find('25541bd8-239a-43cb-be88-5f2b5a38dce8');

            if ($charge) {
                dd($charge);
            }
            else {
                echo 'Charge not found';
            }
        } catch (Exception $e) {
            echo $e->getMessage(); // Unauthorized Not authorized: invalid api key
        }
    }

    /**
     * Find all paid charges
     */
    public function find_all_paid()
    {
        try {
          $charges = \OpenNode\Merchant\Charge::findAllPaid();

          if (!$charges) {
              echo "No paid charges";
          }

          foreach ($charges as $charge) {
            print_r($charge);
            echo "<br /><br />";
          }
        } catch (Exception $e) {
          echo $e->getMessage(); // Unauthorized Not authorized: invalid api key
        }
    }
}
